interface ProjectCardProps {
  title: string
  description: string
  technologies: string[]
  vercelUrl: string
  githubUrl: string
  delay?: string
}

export default function ProjectCard({
  title,
  description,
  technologies,
  vercelUrl,
  githubUrl,
  delay = '0s'
}: ProjectCardProps) {
  return (
    <div
      className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300 animate-slide-up group"
      style={{ animationDelay: delay, opacity: 0 }}
    >
      {/* Project Title */}
      <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent">
        {title}
      </h3>

      {/* Project Description */}
      <p className="text-gray-600 mb-6 leading-relaxed">
        {description}
      </p>

      {/* Technologies */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-2">Technologies:</p>
        <div className="flex flex-wrap gap-2">
          {technologies.map((tech, index) => (
            <span
              key={index}
              className="px-3 py-1 text-sm rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-medium"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {/* Live Demo Button */}
        <a
          href={vercelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>Live Demo</span>
        </a>

        {/* GitHub Button */}
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          <span>GitHub</span>
        </a>
      </div>
    </div>
  )
}
