// Paste the content of your JavaScript file here
const urlParams = new URLSearchParams(window.location.search);
const questionParam = urlParams.get('q');
const answerParam = urlParams.get('a');
const titleParam = urlParams.get('t');
const noButton = document.getElementById('no');

// multiline string
const Instructions = `[Instructions] You can use the following parameters to customize the page:-
->  \`q\`: The question to be displayed on the page. If not provided, a random question will be displayed.
->  \`a\`: The answer to be displayed on the page. If not provided, a random answer will be displayed.
->  \`y\`: The text to be displayed on the YES button. If not provided, the default text ('YES') will be displayed.
->  \`n\`: The text to be displayed on the NO button. If not provided, the default text ('NO') will be displayed.
->  \`t\`: The title of the page. If not provided, the default title ('[ Only Yes ]') will be displayed.
[Note] Refresh the page for buttons & question to reappear.
[Example] https://s41r4j.github.io/webtools/tools/onlyyes.html?q=QXJlIHlvdSBkdW1iPw==&a=SSBrbmV3IGl0ISBEVU1CTyA6KQ==&t=QXJlIHlvdSBEVU1CPw==`;


// Check if the text is base64 encoded
function isBase64(str) {
    try {
        return btoa(atob(str)) === str;
    } catch (err) {
        return false;
    }
}

// Decode the text if it's base64 encoded
function decodeText(text) {
    return isBase64(text) ? atob(text) : text.replace(/^['"](.*)['"]$/, '$1');;
}

// Get a random question (for the default page)
function getRandomQuestion() {
    const questions = ['Do you like coding?', 'Have you ever traveled to space?', 'Is the Earth flat?'];
    return questions[Math.floor(Math.random() * questions.length)];
}

// Get a random answer (for the default page)
function getRandomAnswer() {
    // keep all the answers similar to 'I knew that you would say yes!' (logically & grammatically)
    const answers = ['I knew that you would say yes!', 'It was expected that your answer would be yes!', "I anticipated you'd respond with a yes!", "It was expected that you'd agree positively!"]
    return answers[Math.floor(Math.random() * answers.length)];
}

// Initialize the page
function initializePage() {
    // Check if 't' parameter is provided
    const titleText = titleParam ? decodeText(titleParam) : '[ Only Yes ]';
    document.title = titleText;

    // Check if 'q' parameter is provided
    const questionText = questionParam ? decodeText(questionParam) : getRandomQuestion();
    document.getElementById('question').innerText = questionText;

    // Checking to display the instructions
    if (!questionParam && !answerParam) {
        document.getElementById('footer').innerText = Instructions;
    } else {
        document.getElementById('footer').innerText = 'Made with ❤️ by s41r4j';
        document.getElementById('footer').style.textAlign = 'center';
    }
}

// Submitting the answer
function submitAnswer() {
    console.log('submitting answer: ' + answerParam);
    // window.location.href = `onlyyes.html?a=${decodeText(answerParam)}`;
    // if `a` parameter is not provided, use a random answer
    const answerText = answerParam ? decodeText(answerParam) : getRandomAnswer();
    document.getElementById('question').innerText = answerText;

    // hide the buttons
    document.getElementById('yes').style.display = 'none';
    document.getElementById('no').style.display = 'none';
}

// Update the button texts
function updateButton() {
    // Check if 'y' and 'n' parameters are provided
    const yesParam = urlParams.get('y');
    const noParam = urlParams.get('n');

    // Check if custom button texts are provided
    if (yesParam) {
        document.getElementById('yes').innerText = decodeText(yesParam);
    }
    if (noParam) {
        document.getElementById('no').innerText = decodeText(noParam);
    }

}


// main function
initializePage();
updateButton();

// Add event listeners to the NO button
noButton.addEventListener('mouseover', moveNoButton);
noButton.addEventListener('click', moveNoButton);

function moveNoButton() {
    // Change the position of the "NO" button
    noButton.style.top = `${Math.floor(Math.random() * 100)}%`;
    noButton.style.left = `${Math.floor(Math.random() * 100)}%`;
}
