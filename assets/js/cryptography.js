<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="../assets/css/cryptography.css">
  <title>[ Cryptography ]</title>
</head>

<body>
  <div class="container">
    <h1 class="heading"><span class="initials">C</span>ryptography</h1>
    <form id="cryptoForm">
      <label for="inputText">Input:</label>
      <div class="input-container">
        <textarea id="inputText" placeholder="Enter your text..."></textarea>
      </div>

      <label for="inputSalt" id="saltLabel">Salt:</label>
      <div class="input-container">
        <textarea id="inputSalt" placeholder="Enter your salt..."></textarea>
      </div>

      <label for="cryptoOption">Select an Encryption:</label>
      <select id="cryptoOption">
        <option value="md5">MD5</option>
        <option value="sha1">SHA-1</option>
        <option value="sha256">SHA-256</option>
        <option value="sha512">SHA-512</option>
        <option value="zcrypt">Zcrypt</option>
        <option value="base64">Base64 Encode</option>
        <option value="base64Decode">Base64 Decode</option>
        <option value="rot13">ROT13</option>
      </select>

      <label for="outputText">Output:</label>
      <textarea id="outputText" placeholder="Output will appear here..." readonly></textarea>

      <button type="button" id="copyButton">Copy</button>

      <div class="toggle-container">
        <input type="checkbox" class="checkbox" id="passwordToggle">
        <label class="toggle" for="passwordToggle">
          <div class="slider"></div>
        </label>
      </div>
    </form>

    <div id="popUpMessage">Copied!</div>
  </div>

  <script src="../assets/js/crypto-js.min.js"></script>
  <script src="../assets/js/zcrypt.js"></script>
  <script src="../assets/js/cryptography.js"></script>
</body>

</html>
