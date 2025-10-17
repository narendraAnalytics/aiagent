"""
Clerk authentication middleware
"""

from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict
import httpx
import jwt
from jwt import PyJWKClient
from functools import lru_cache

from app.config import get_settings

settings = get_settings()
# Set auto_error=False to handle missing auth gracefully
security = HTTPBearer(auto_error=False)


class ClerkUserData(BaseModel):
    """Structured Clerk user data from JWT token"""

    id: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    email_addresses: List[dict] = []
    created_at: Optional[int] = None
    updated_at: Optional[int] = None


@lru_cache()
def get_jwks_client() -> PyJWKClient:
    """Get cached JWKS client for Clerk public keys"""
    import base64

    # Extract the Clerk instance domain from the publishable key
    # Format: pk_test_<base64-encoded-domain> or pk_live_<base64-encoded-domain>
    publishable_key = settings.CLERK_PUBLISHABLE_KEY

    # Extract the base64 part after pk_test_ or pk_live_
    if publishable_key.startswith("pk_test_"):
        encoded_domain = publishable_key.replace("pk_test_", "")
    elif publishable_key.startswith("pk_live_"):
        encoded_domain = publishable_key.replace("pk_live_", "")
    else:
        raise ValueError("Invalid Clerk publishable key format")

    # Decode the domain
    try:
        # Add padding if needed (base64 requires length to be multiple of 4)
        padding = 4 - (len(encoded_domain) % 4)
        if padding != 4:
            encoded_domain += "=" * padding

        domain_bytes = base64.b64decode(encoded_domain)
        clerk_domain = domain_bytes.decode("utf-8").rstrip("$")
    except Exception:
        # Fallback to a default if decoding fails
        clerk_domain = "clerk.accounts.dev"

    # Construct JWKS URL
    jwks_url = f"https://{clerk_domain}/.well-known/jwks.json"

    return PyJWKClient(jwks_url)


async def verify_clerk_token(token: str) -> str:
    """
    Verify Clerk JWT token using JWKS and return user ID

    Returns:
        str: The user ID (from 'sub' claim)
    """
    try:
        # Get the JWKS client
        jwks_client = get_jwks_client()

        # Get the signing key from the JWKS
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        # Verify and decode the JWT token
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_iat": True,
            }
        )

        # Extract user ID from the token
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def fetch_clerk_user_details(user_id: str) -> dict:
    """
    Fetch full user details from Clerk API using Secret Key

    Args:
        user_id: The Clerk user ID

    Returns:
        dict: Full user data from Clerk API
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://api.clerk.com/v1/users/{user_id}",
                headers={
                    "Authorization": f"Bearer {settings.CLERK_SECRET_KEY}",
                    "Content-Type": "application/json",
                },
            )

            if response.status_code == 200:
                return response.json()
            elif response.status_code == 401:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Clerk Secret Key",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            elif response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User {user_id} not found in Clerk",
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to fetch user from Clerk API: {response.status_code}",
                )
    except HTTPException:
        raise
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Clerk API timeout. Please try again.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user details: {str(e)}",
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> ClerkUserData:
    """Get current authenticated user from Clerk token"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Step 1: Verify the JWT token and get user ID
    user_id = await verify_clerk_token(credentials.credentials)

    # Step 2: Fetch full user details from Clerk API
    user_data = await fetch_clerk_user_details(user_id)

    # Step 3: Extract primary email
    primary_email = None
    email_addresses = user_data.get("email_addresses", [])
    for email_obj in email_addresses:
        if email_obj.get("id") == user_data.get("primary_email_address_id"):
            primary_email = email_obj.get("email_address")
            break

    # Fallback to first email if no primary found
    if not primary_email and email_addresses:
        primary_email = email_addresses[0].get("email_address")

    # Step 4: Convert to Pydantic model with complete data
    return ClerkUserData(
        id=user_data.get("id"),
        email=primary_email,
        first_name=user_data.get("first_name"),
        last_name=user_data.get("last_name"),
        username=user_data.get("username"),
        email_addresses=email_addresses,
        created_at=user_data.get("created_at"),
        updated_at=user_data.get("updated_at"),
    )


async def get_user_id(request: Request) -> Optional[str]:
    """Extract user ID from request (for dependency injection)"""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ")[1]
        user_id = await verify_clerk_token(token)
        return user_id
    except Exception:
        return None
