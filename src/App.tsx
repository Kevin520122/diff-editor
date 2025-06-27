import { DiffChatEditor } from './components/DiffChatEditor';

const SAMPLE_TEXT = `Welcome to the Diff Chat Editor!

This is a powerful text editing tool that integrates with OpenAI to provide intelligent suggestions for improving your content. Here are some key features:

• Chat with AI to get text improvement suggestions
• View differences between versions with syntax highlighting
• Navigate through version history with undo/redo
• Accept or reject individual suggestions
• Export and import your work

Try asking the AI to:
- "Make this more professional"
- "Fix grammar and spelling errors"
- "Rewrite paragraph 2 to be more concise"
- "Add more examples to explain the features"

Get started by entering your OpenAI API key in the settings panel!`;

function App() {
  return (
    <div className="App">
      <div className="wordvice-container">
        <DiffChatEditor
          initialText={SAMPLE_TEXT}
          openAIApiKey=""
          placeholder="Start editing your text here..."
          className="wordvice-fade-in"
        />
      </div>
    </div>
  );
}

export default App; 