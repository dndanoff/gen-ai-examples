export const SHARED_PROMPT_ELEMENTS = {
  // Common requirements that all agents should follow
  CORE_REQUIREMENTS: `
**Core Requirements (MUST follow):**
- NEVER hallucinate - stick strictly to provided information
- Company name and business domain must be clearly stated
- Project purpose/goal must be concrete and specific
- Include technical challenges: performance, distributed systems, scalability, high-load, big data
- Maintain professional, engaging tone that showcases technical complexity`,

  // Expected output structure
  EXPECTED_STRUCTURE: `
**Expected Structure:**
- Main Description: 3-5 sentences maximum
- Technologies: List of technologies, frameworks, tools used
- Keywords: Domain, architecture patterns, work types (digitalization/modernization/etc.)`,

  // Quality criteria
  QUALITY_CRITERIA: `
**Quality Standards:**
- Balance technical depth with business impact
- Use active voice and strong action verbs
- Target audience: technical recruiters and hiring managers
- Highlight technical achievements and business value`,
};

export const CV_CONTEXT = `This is for an IT professional's CV project description that will be reviewed by technical recruiters and hiring managers.`;