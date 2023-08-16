I've developed a simple frontend using VITE, and you can find the Git repository here: https://github.com/binyaalex/vite-app.

In addition, I've created a straightforward frontend that you can access on port 3000, eliminating the need to run both the frontend and backend separately. For your convenience, I've set up an automated test for the software in the "Test" folder. You can initiate the test by running test.js simultaneously with Index.js.

Based on testing with 27 different resumes, the success rates are as follows:
- ID - 85% success
- Extracting Name, LinkedIn, email, and cell phone information - 96% success
- Success rate of extracting a name when there's no LinkedIn link in the same resume - 88% success

In our CV information extraction project, I opted for a schema-based database. This choice ensures consistent data entry and accuracy due to structured formats in CVs. It also boosts query performance, facilitates data analysis, and adapts smoothly to evolving CV formats. Overall, the schema approach aligns perfectly with our focus on precision, efficiency, and adaptability.