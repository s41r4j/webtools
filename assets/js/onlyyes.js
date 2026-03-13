(function initOnlyYes() {
    const urlParams = new URLSearchParams(window.location.search);
    const questionParam = urlParams.get('q');
    const answerParam = urlParams.get('a');
    const titleParam = urlParams.get('t');
    const yesButton = document.getElementById('yes');
    const noButton = document.getElementById('no');
    const questionElement = document.getElementById('question');
    const footerElement = document.getElementById('footer');
    const optionsContainer = document.querySelector('.options-container');

    if (!yesButton || !noButton || !questionElement || !footerElement || !optionsContainer) return;

    const instructions = [
        'Parameters',
        'q = question text (plain text or Base64)',
        'a = answer shown after pressing yes',
        'y = yes button label',
        'n = no button label',
        't = page title',
        '',
        'Refresh the page to reset the moving button.',
        '',
        'Example',
        `${window.location.origin}${window.location.pathname}?q=QXJlIHlvdSBjdXJpb3VzPw==&a=SSBrbmV3IHlvdSB3b3VsZCBzYXkgeWVzLg==`
    ].join('\n');

    function isBase64(value) {
        try {
            return btoa(atob(value)) === value;
        } catch (error) {
            return false;
        }
    }

    function decodeText(value) {
        return isBase64(value) ? atob(value) : value.replace(/^['"](.*)['"]$/, '$1');
    }

    function getRandomQuestion() {
        const questions = [
            'Do you still want to press the easy button?',
            'Would you like to continue this curious experiment?',
            'Are you absolutely certain about your answer?'
        ];
        return questions[Math.floor(Math.random() * questions.length)];
    }

    function getRandomAnswer() {
        const answers = [
            'I had a feeling you would say yes.',
            'That was the expected answer all along.',
            'The page suspected you would choose yes.'
        ];
        return answers[Math.floor(Math.random() * answers.length)];
    }

    function updateButtonLabels() {
        const yesParam = urlParams.get('y');
        const noParam = urlParams.get('n');

        if (yesParam) {
            yesButton.innerText = decodeText(yesParam);
        }

        if (noParam) {
            noButton.innerText = decodeText(noParam);
        }
    }

    function randomPositionWithinContainer() {
        const bounds = optionsContainer.getBoundingClientRect();
        const maxX = Math.max(bounds.width - noButton.offsetWidth, 0);
        const maxY = Math.max(bounds.height - noButton.offsetHeight, 0);

        return {
            left: Math.floor(Math.random() * (maxX + 1)),
            top: Math.floor(Math.random() * (maxY + 1))
        };
    }

    function moveNoButton() {
        const nextPosition = randomPositionWithinContainer();
        noButton.style.left = `${nextPosition.left}px`;
        noButton.style.top = `${nextPosition.top}px`;
    }

    function initializePage() {
        const titleText = titleParam ? decodeText(titleParam) : 'Only Yes';
        document.title = titleText;

        const questionText = questionParam ? decodeText(questionParam) : getRandomQuestion();
        questionElement.innerText = questionText;

        if (!questionParam && !answerParam) {
            footerElement.innerText = instructions;
        } else {
            footerElement.innerText = 'Filed in the prank drawer.';
        }
    }

    window.submitAnswer = function () {
        const answerText = answerParam ? decodeText(answerParam) : getRandomAnswer();
        questionElement.innerText = answerText;
        yesButton.style.display = 'none';
        noButton.style.display = 'none';
    };

    initializePage();
    updateButtonLabels();

    requestAnimationFrame(moveNoButton);
    noButton.addEventListener('mouseover', moveNoButton);
    noButton.addEventListener('click', function (event) {
        event.preventDefault();
        moveNoButton();
    });
})();
