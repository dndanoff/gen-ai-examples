import { generateDescription } from '@src/core/agents/author';
import { scoreDescription } from '@src/core/agents/critique';
import { refinedDescription } from '@src/core/agents/editor';
import { reviewDescription } from '@src/core/agents/reviewer';
import { runWorkflow } from '@src/core/workflows/projectExperienceForCV';

// generateDescription("Developed a web application for managing personal finances with React and Nodejs.It handled more than 400 concurent request per minute. The project was call myFinance").then(console.log);

// reviewDescription("Developed a web application for managing personal finances with React and Nodejs. It handled more than 400 concurrent requests per minute. The project was called myFinance").then(console.log);

// refinedDescription(
//   "Developed a web application for managing personal finances with React and Nodejs. It handled more than 400 concurrent requests per minute. The project was called myFinance",
//   "The project description is too short and lacks essential details. It does not mention the company or its domain, and the tone is not catchy or convincing. The description does not explicitly state the concrete project goal beyond 'managing personal finances.' While it mentions a specific challenge (handling 400 concurrent requests per minute), it does not elaborate on other potential challenges like scalability or performance issues. The technology used is mentioned (React and Nodejs), but there is no dedicated technology section or keywords section.",
//   [
//     'Specify the company name and its domain.',
//     "Clearly state the project's objective and its impact.",
//     'Elaborate on the challenges faced and how they were addressed.',
//     "Include a dedicated 'Technologies' section listing React, Nodejs, and any other technologies used.",
//     "Add a 'Keywords' section with relevant terms such as 'web application', 'concurrent requests', 'scalability', 'personal finance management'.",
//     "Enhance the tone to make it more engaging and highlight the project's achievements and challenges."
//   ]).then(console.log);

// scoreDescription("At **FinTech Solutions**, a leading company in the financial services domain, I developed **myFinance**, a robust web application designed to streamline personal finance management for thousands of users. This project aimed to enhance user experience by providing a scalable and high-performance platform capable of handling over 400 concurrent requests per minute. Key challenges included ensuring the application's scalability and performance under heavy loads, which were addressed through efficient backend optimization using Nodejs and a responsive frontend built with React. The project significantly improved financial management for its users by offering real-time tracking and management tools. Technologies: React, Nodejs. Keywords: web application, concurrent requests, scalability, personal finance management, financial services, high-performance").then(console.log);

runWorkflow(
  'Developed a web application for managing personal finances with React and Nodejs. It handled more than 400 concurrent requests per minute. The project was called myFinance.',
)
  .then(console.log)
  .then(() => process.exit());
