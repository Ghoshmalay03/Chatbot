function appendMessage(sender, message) {
    const chatbox = document.getElementById('chatbox');
    const messageDiv = document.createElement('div');
    messageDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatbox.appendChild(messageDiv);
    chatbox.scrollTop = chatbox.scrollHeight;
  }
  
  function handleUserInput() {
    const inputField = document.getElementById('userInput');
    const userMessage = inputField.value.trim();
    if (!userMessage) return;
  
    appendMessage('You', userMessage);
    inputField.value = '';
  
    // Simulate AI response
    setTimeout(() => {
      getSmartHomeResponse(userMessage).then(response => {
        appendMessage('SmartHome AI', response);
      });
    }, 500);
  }
  
  async function getSmartHomeResponse(userInput) {
    // Placeholder for actual smart home API logic
    // Replace this with real API calls later
    if (userInput.toLowerCase().includes("lights")) {
      return "Sure, I can help you control your lights. Would you like to turn them on or off?";
    } else if (userInput.toLowerCase().includes("temperature")) {
      return "To adjust the thermostat, please specify the desired temperature.";
    } else {
      return "I'm here to assist you with smart home controls. Could you please clarify your request?";
    }
  }
  