document.addEventListener('DOMContentLoaded', function() {
  const inputTextElement = document.getElementById('inputText');
  const inputSaltElement = document.getElementById('inputSalt');
  const outputTextElement = document.getElementById('outputText');
  const cryptoOptionElement = document.getElementById('cryptoOption');
  const copyButton = document.getElementById('copyButton');
  const passwordToggle = document.getElementById('passwordToggle');
  const popUpMessage = document.getElementById('popUpMessage');
  const saltLabel = document.getElementById('saltLabel');

  function showMessage() {
    popUpMessage.classList.add('show');
    setTimeout(() => {
      popUpMessage.classList.remove('show');
    }, 2000);
  }

  passwordToggle.addEventListener('click', function() {
    if (passwordToggle.checked) {
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

  function rot(text, shift) {
    if (shift === '' || shift === null || shift === undefined || shift < 0 || shift > 25) {
      shift = 13;
    }
    return text.replace(/[a-zA-Z]/g, function(c) {
      const charCode = c.charCodeAt(0);
      const baseCharCode = c >= 'a' ? 'a'.charCodeAt(0) : 'A'.charCodeAt(0);
      return String.fromCharCode((charCode - baseCharCode + shift) % 26 + baseCharCode);
    });
  }

  function updateOutput() {
    const inputText = inputTextElement.value;
    const inputSalt = inputSaltElement.value;
    const selectedOption = cryptoOptionElement.value;

    if (inputText === previousInput) {
      outputTextElement.value = previousOutput;
      return;
    }

    let outputText = '';
    switch (selectedOption) {
      case 'md5':
        outputText = CryptoJS.MD5(inputText).toString();
        break;
      case 'sha1':
        outputText = CryptoJS.SHA1(inputText).toString();
        break;
      case 'sha256':
        outputText = CryptoJS.SHA256(inputText).toString();
        break;
      case 'sha512':
        outputText = CryptoJS.SHA512(inputText).toString();
        break;
      case 'zcrypt':
        if (inputText === '' || inputSalt === '') {
          outputText = '';
          break;
        } else {
        outputText = zcrypt(inputText, inputSalt);
        break;
        }
      case 'reverse':
        outputText = inputText.split('').reverse().join('');
        break;
      case 'rot':
        outputText = rot(inputText, inputSalt);
        break;
      case 'base64Encode':
        outputText = btoa(inputText);
        break;
      case 'base64Decode':
        outputText = atob(inputText);
        break;
      case 'binaryEncode':
        outputText = inputText.split('').map(function(c) {
          return c.charCodeAt(0).toString(2);
        }).join(' ');
        break;
      case 'binaryDecode':
        outputText = inputText.split(' ').map(function(c) {
          return String.fromCharCode(parseInt(c, 2));
        }).join('');
        break;
      case 'octalEncode':
        outputText = inputText.split('').map(function(c) {
          return c.charCodeAt(0).toString(8);
        }).join(' ');
        break;
      case 'octalDecode':
        outputText = inputText.split(' ').map(function(c) {
          return String.fromCharCode(parseInt(c, 8));
        }).join('');
        break;
      case 'hexEncode':
        outputText = inputText.split('').map(function(c) {
          return c.charCodeAt(0).toString(16);
        }).join('');
        break;
      case 'hexDecode':
        outputText = inputText.replace(/([a-fA-F0-9]{2})/g, function() {
          return String.fromCharCode(parseInt(arguments[1], 16));
        });
        break;
      case 'urlEncode':
        outputText = encodeURIComponent(inputText);
        break;
      case 'urlDecode':
        outputText = decodeURIComponent(inputText);
        break;
      case 'aesEncrypt':
          encrypted = CryptoJS.AES.encrypt(inputText, inputSalt);
          outputText = encrypted.toString();
          break;
      case 'aesDecrypt':
          decrypted = CryptoJS.AES.decrypt(inputText, inputSalt);
          outputText = decrypted.toString(CryptoJS.enc.Utf8);
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

  inputSaltElement.addEventListener('input', updateOutput);
  inputTextElement.addEventListener('input', updateOutput);
  
  cryptoOptionElement.addEventListener('change', function() {
    const selectedOption = cryptoOptionElement.value;
    
    if (selectedOption === 'zcrypt' || selectedOption === 'aesEncrypt' || selectedOption === 'aesDecrypt' || selectedOption === 'rot') {
      inputSaltElement.disabled = false;
    } else {
      inputSaltElement.disabled = true;
    }
    
    clearOutput();
    updateOutput();
  });

  if (selectedOption === 'zcrypt' || selectedOption === 'aesEncrypt' || selectedOption === 'aesDecrypt' || selectedOption === 'rot') {
    inputSaltElement.disabled = false;
  } else {
    inputSaltElement.disabled = true;
  }
  inputTextElement.focus();
});
