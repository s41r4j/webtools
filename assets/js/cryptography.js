(function initCryptography() {
  const inputTextElement = document.getElementById('inputText');
  const inputSaltElement = document.getElementById('inputSalt');
  const outputTextElement = document.getElementById('outputText');
  const cryptoOptionElement = document.getElementById('cryptoOption');
  const copyButton = document.getElementById('copyButton');
  const passwordToggle = document.getElementById('passwordToggle');
  const popUpMessage = document.getElementById('popUpMessage');
  const saltLabel = document.getElementById('saltLabel');
  const helperElement = document.getElementById('cryptoHelper');
  const hintElement = document.getElementById('modeHint');

  if (!inputTextElement || !inputSaltElement || !outputTextElement || !cryptoOptionElement) return;

  const methodDetails = {
    md5: {
      needsSalt: false,
      helper: 'One-way hash for short integrity checks.',
      hint: 'MD5 is fast and weak; use it for compatibility, not for secure password storage.'
    },
    sha1: {
      needsSalt: false,
      helper: 'Legacy one-way hash.',
      hint: 'SHA-1 is deprecated for security-sensitive use cases.'
    },
    sha256: {
      needsSalt: false,
      helper: 'Modern one-way hash with a compact footprint.',
      hint: 'Useful when you want a common deterministic digest.'
    },
    sha512: {
      needsSalt: false,
      helper: 'Longer one-way hash with a larger digest.',
      hint: 'Useful when you want a wider hash output.'
    },
    zcrypt: {
      needsSalt: true,
      helper: 'A keyed custom transform.',
      hint: 'Requires both input text and a salt or key.'
    },
    rot: {
      needsSalt: true,
      helper: 'Letter rotation with a numeric shift.',
      hint: 'Leave the key empty to use the default shift of 13.'
    },
    reverse: {
      needsSalt: false,
      helper: 'Simple character reversal.',
      hint: 'A readable transform that can be reversed by running it again.'
    },
    base64Encode: {
      needsSalt: false,
      helper: 'Encode plain text into Base64.',
      hint: 'Useful for packaging bytes as printable ASCII.'
    },
    base64Decode: {
      needsSalt: false,
      helper: 'Decode Base64 back into plain text.',
      hint: 'Input must be valid Base64.'
    },
    binaryEncode: {
      needsSalt: false,
      helper: 'Convert each character into binary.',
      hint: 'Outputs groups of bits separated by spaces.'
    },
    binaryDecode: {
      needsSalt: false,
      helper: 'Decode space-separated binary groups.',
      hint: 'Input should contain valid binary values.'
    },
    octalEncode: {
      needsSalt: false,
      helper: 'Convert each character into octal.',
      hint: 'Outputs space-separated octal values.'
    },
    octalDecode: {
      needsSalt: false,
      helper: 'Decode space-separated octal values.',
      hint: 'Input should contain valid octal values.'
    },
    hexEncode: {
      needsSalt: false,
      helper: 'Convert text into hexadecimal.',
      hint: 'Outputs a continuous hex string.'
    },
    hexDecode: {
      needsSalt: false,
      helper: 'Decode hexadecimal text.',
      hint: 'Input should contain pairs of valid hex characters.'
    },
    urlEncode: {
      needsSalt: false,
      helper: 'Encode reserved URL characters.',
      hint: 'Useful for query parameters and path fragments.'
    },
    urlDecode: {
      needsSalt: false,
      helper: 'Decode URL-encoded text.',
      hint: 'Input must be valid percent-encoded text.'
    },
    aesEncrypt: {
      needsSalt: true,
      helper: 'Encrypt text using AES and a passphrase.',
      hint: 'Requires a passphrase; output is a ciphertext string.'
    },
    aesDecrypt: {
      needsSalt: true,
      helper: 'Decrypt an AES ciphertext using a passphrase.',
      hint: 'Requires the same passphrase that was used during encryption.'
    }
  };

  let previousSignature = '';
  let messageTimer = null;

  function showMessage(text) {
    if (!popUpMessage) return;

    popUpMessage.textContent = text;
    popUpMessage.classList.add('show');

    if (messageTimer) {
      clearTimeout(messageTimer);
    }

    messageTimer = setTimeout(() => {
      popUpMessage.classList.remove('show');
    }, 1800);
  }

  async function copyOutput() {
    if (!outputTextElement.value) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(outputTextElement.value);
      } else {
        outputTextElement.select();
        document.execCommand('copy');
      }
      showMessage('Copied to clipboard.');
    } catch (error) {
      console.error('Copy failed:', error);
      showMessage('Unable to copy.');
    }
  }

  function rot(text, shift) {
    const parsedShift = Number(shift);
    const safeShift = Number.isInteger(parsedShift) && parsedShift >= 0 && parsedShift <= 25 ? parsedShift : 13;

    return text.replace(/[a-zA-Z]/g, function (character) {
      const charCode = character.charCodeAt(0);
      const baseCharCode = character >= 'a' ? 'a'.charCodeAt(0) : 'A'.charCodeAt(0);
      return String.fromCharCode((charCode - baseCharCode + safeShift) % 26 + baseCharCode);
    });
  }

  function updateMethodNotes() {
    const details = methodDetails[cryptoOptionElement.value] || methodDetails.md5;
    const needsSalt = !!details.needsSalt;

    inputSaltElement.disabled = !needsSalt;
    if (!needsSalt) {
      inputSaltElement.classList.remove('blurred');
    } else if (passwordToggle.checked) {
      inputSaltElement.classList.add('blurred');
    }

    if (saltLabel) {
      saltLabel.textContent = needsSalt ? 'Salt / key' : 'Salt / key (not required)';
    }

    if (helperElement) {
      helperElement.textContent = details.helper;
    }

    if (hintElement) {
      hintElement.textContent = details.hint;
    }
  }

  function transformText(inputText, inputSalt, selectedOption) {
    if (!inputText) return '';

    try {
      switch (selectedOption) {
        case 'md5':
          return CryptoJS.MD5(inputText).toString();
        case 'sha1':
          return CryptoJS.SHA1(inputText).toString();
        case 'sha256':
          return CryptoJS.SHA256(inputText).toString();
        case 'sha512':
          return CryptoJS.SHA512(inputText).toString();
        case 'zcrypt':
          return inputSalt ? zcrypt(inputText, inputSalt) : '';
        case 'reverse':
          return inputText.split('').reverse().join('');
        case 'rot':
          return rot(inputText, inputSalt);
        case 'base64Encode':
          return btoa(inputText);
        case 'base64Decode':
          return atob(inputText);
        case 'binaryEncode':
          return inputText.split('').map((character) => character.charCodeAt(0).toString(2)).join(' ');
        case 'binaryDecode':
          return inputText.split(' ').map((chunk) => String.fromCharCode(parseInt(chunk, 2))).join('');
        case 'octalEncode':
          return inputText.split('').map((character) => character.charCodeAt(0).toString(8)).join(' ');
        case 'octalDecode':
          return inputText.split(' ').map((chunk) => String.fromCharCode(parseInt(chunk, 8))).join('');
        case 'hexEncode':
          return inputText.split('').map((character) => character.charCodeAt(0).toString(16)).join('');
        case 'hexDecode':
          return inputText.replace(/([a-fA-F0-9]{2})/g, function (match, hexValue) {
            return String.fromCharCode(parseInt(hexValue, 16));
          });
        case 'urlEncode':
          return encodeURIComponent(inputText);
        case 'urlDecode':
          return decodeURIComponent(inputText);
        case 'aesEncrypt': {
          if (!inputSalt) return '';
          const encrypted = CryptoJS.AES.encrypt(inputText, inputSalt);
          return encrypted.toString();
        }
        case 'aesDecrypt': {
          if (!inputSalt) return '';
          const decrypted = CryptoJS.AES.decrypt(inputText, inputSalt);
          return decrypted.toString(CryptoJS.enc.Utf8);
        }
        default:
          return '';
      }
    } catch (error) {
      return 'Invalid input for the selected method.';
    }
  }

  function updateOutput() {
    const signature = `${cryptoOptionElement.value}::${inputSaltElement.value}::${inputTextElement.value}`;
    if (signature === previousSignature) return;

    outputTextElement.value = transformText(
      inputTextElement.value,
      inputSaltElement.value,
      cryptoOptionElement.value
    );

    previousSignature = signature;
  }

  function togglePrivacy() {
    inputTextElement.classList.toggle('blurred', passwordToggle.checked);
    if (!inputSaltElement.disabled) {
      inputSaltElement.classList.toggle('blurred', passwordToggle.checked);
    }
  }

  copyButton?.addEventListener('click', copyOutput);
  passwordToggle?.addEventListener('change', togglePrivacy);
  inputTextElement.addEventListener('input', updateOutput);
  inputSaltElement.addEventListener('input', updateOutput);
  cryptoOptionElement.addEventListener('change', function () {
    previousSignature = '';
    updateMethodNotes();
    togglePrivacy();
    updateOutput();
  });

  updateMethodNotes();
  togglePrivacy();
  updateOutput();
  inputTextElement.focus();
})();
