document.addEventListener('DOMContentLoaded', function() {
    const inputTextElement = document.getElementById('inputText');
    const outputTextElement = document.getElementById('outputText');
    const cryptoOptionElement = document.getElementById('cryptoOption');
    const copyButton = document.getElementById('copyButton');
    const passwordToggle = document.getElementById('passwordToggle');
    const popUpMessage = document.getElementById('popUpMessage');
  
    function showMessage() {
      popUpMessage.classList.add('show');
      setTimeout(() => {
        popUpMessage.classList.remove('show');
      }, 2000);
    }

    passwordToggle.addEventListener('click', function() {
      if (passwordToggle.checked) {
        console.log('checked');
        inputTextElement.setAttribute('style', 'color: transparent;text-shadow: 0 0 8px rgba(0,0,0,0.5);');
      } else {
        inputTextElement.removeAttribute('style');
      }
    });

    copyButton.addEventListener('click', function() {
      outputTextElement.select();
      document.execCommand('copy');
      showMessage();
    });
  
    let previousInput = '';
    let previousOutput = '';
  
    function md5(text) {
      return CryptoJS.MD5(text).toString();
    }
  
    function sha1(text) {
      return CryptoJS.SHA1(text).toString();
    }
  
    function sha256(text) {
      return CryptoJS.SHA256(text).toString();
    }
  
    function sha512(text) {
      return CryptoJS.SHA512(text).toString();
    }
  
    function base64Encode(text) {
      return btoa(text);
    }
  
    function base64Decode(encodedText) {
      return atob(encodedText);
    }
  
    function rot13(text) {
      return text.replace(/[a-zA-Z]/g, function(c) {
        const charCode = c.charCodeAt(0);
        const baseCharCode = c >= 'a' ? 'a'.charCodeAt(0) : 'A'.charCodeAt(0);
        return String.fromCharCode((charCode - baseCharCode + 13) % 26 + baseCharCode);
      });
    }
  
    function updateOutput() {
      const inputText = inputTextElement.value;
      const selectedOption = cryptoOptionElement.value;
  
      if (inputText === previousInput) {
        outputTextElement.value = previousOutput;
        return;
      }
  
      let outputText = '';
      switch (selectedOption) {
        case 'md5':
          outputText = md5(inputText);
          break;
        case 'sha1':
          outputText = sha1(inputText);
          break;
        case 'sha256':
          outputText = sha256(inputText);
          break;
        case 'sha512':
          outputText = sha512(inputText);
          break;
        case 'base64':
          outputText = base64Encode(inputText);
          break;
        case 'base64Decode':
          outputText = base64Decode(inputText);
          break;
        case 'rot13':
          outputText = rot13(inputText);
          break;
        default:
          outputText = '';
      }
  
      outputTextElement.value = outputText;
      previousInput = inputText;
      previousOutput = outputText;
    }
  
    function clearOutput() {
      outputTextElement.value = '';
      previousInput = '';
      previousOutput = '';
    }
  
    inputTextElement.addEventListener('input', updateOutput);
    cryptoOptionElement.addEventListener('change', function() {
      clearOutput();
      updateOutput();
    });

    inputTextElement.focus();
  });
  