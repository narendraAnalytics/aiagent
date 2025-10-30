import ProjectCard from './ProjectCard'

// TODO: Update these placeholder projects with your actual project details
const projects = [
  {
    title: 'ProfessionalLifeStyleShoot',
    description: 'AI-powered lifestyle photography SaaS platform where users can generate, customize, and manage professional lifestyle photos using cutting-edge AI.',
    technologies: ['Next.js + React', 'Prisma + Neon DB ', 'Tailwind + shadcn','authentication with Clerk'],
    vercelUrl: 'https://professional-life-style-shoot.vercel.app/',
    githubUrl: 'https://github.com/narendraAnalytics/ProfessionalLifeStyleShoot.git'
  },
  {
    title: 'SnapCook',
    description: 'AI-powered cooking companion that turns everyday ingredients into smart, delicious recipes.',
    technologies: ['Next.js + Gemini AI', ' Tailwind CSS', 'Neon DB', 'shadcn/ui'],
    vercelUrl: 'https://snapcook-psi.vercel.app/',
    githubUrl: 'https://github.com/narendraAnalytics/snapcook.git'
  },
  {
    title: 'StepWise',
    description: 'AI tutor that teaches you the steps!.From a simple photo to a full step-by-step explanation — learning math just got smarter.',
    technologies: ['Next.js', 'Neon DB', 'drizlle', 'Tailwind CSS'],
    vercelUrl: 'https://stepwise-gules.vercel.app/',
    githubUrl: 'https://github.com/narendraAnalytics/stepwise.git'
  }
]

export default function Projects() {
  return (
    <section className="relative bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 py-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent">
            Featured Projects
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Check out some of my recent work. Each project showcases different skills and technologies.
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <ProjectCard
              key={index}
              title={project.title}
              description={project.description}
              technologies={project.technologies}
              vercelUrl={project.vercelUrl}
              githubUrl={project.githubUrl}
              delay={`${0.2 + index * 0.1}s`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
