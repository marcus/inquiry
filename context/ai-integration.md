Read ./project-overview.md for more context.

When a user is viewing a completed inquiry (either by reaching the end of the questions or by going to the index page and clicking to view an inquiry) add a feature that sends the markdown text of the inquiry to an llm (e.g. OpenAI) and returns the llm's response.

The prompt should include:

"Act as a loving non-dual teacher and guide. This message contains a completed self-inquiry done in the format that Byron Katie uses in her process of doing "The Work." Please provide a detailed response that gives guidance and insight on the inquiry. The guidance should be fully honest and not simply confirm beliefs that can still be seen through. Your ultimate value is truth above all. Provide feedback on each section of the inquiry. Provide possible next beliefs to inquire into at the end of your response in a list with each topic on a new line under the heading titled exactly like this:

"Potential Next Beliefs:"

Here is the inquiry text:
{inquiryText}

The response to the prompt should be streamed as markdown back to the user below their inquiry. The markdown should be displayed formatted in HTML.

The reponse should only be generated when the user clicks a button below the inquiry that says "Get Guidance".

The response should be saved to the database in a new table and linked to the inquiry by id.

If a response already exists, always show it. There should be a subtle refresh icon to allow the inquiry to be sent again to the AI if the user wishes to re-generate it.

Use chatgpt-4o as the default model. 

Assume $OPEN_AI_API_KEY is available in the environment.

Use Token.js to call the LLM. 

import { TokenJS } from 'token.js'

const tokenjs = new TokenJS()

async function main() {
  const result = await tokenjs.chat.completions.create({
    stream: true,
    provider: 'openai',
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: `Tell me about yourself.`,
      },
    ],
  })

  for await (const part of result) {
    process.stdout.write(part.choices[0]?.delta?.content || '')
  }
}
main()
https://docs.tokenjs.ai


Convert the potential next beliefs returned by the LLM to links of topics that would begin a new inquiry and pre-populate the belief field within the app.