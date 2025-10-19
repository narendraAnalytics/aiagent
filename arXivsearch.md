We are using uv install 

%pip install --upgrade --quiet  langchain-community arxiv

from langchain import hub
from langchain.agents import AgentExecutor, create_react_agent, load_tools
from langchain_openai import ChatOpenAI

// llm = ChatOpenAI(temperature=0.0) we are using gemini 2.5 model
tools = load_tools(
    ["arxiv"],
)
prompt = hub.pull("hwchase17/react")

agent = create_react_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)


agent_executor.invoke(
    {
        "input": "What's the paper 1605.08386 about?",
    }
)

from langchain_community.utilities import ArxivAPIWrapper 