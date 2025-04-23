// SECURITY WARNING: Do NOT expose your API key in client-side code in production!
const GEMINI_API_KEY = "AIzaSyCOsMm6RsQbP6AgpW7aBvV7SEVXRAAqfZs";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

// Get DOM elements
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// --- Simulated Data ---

// Simple store price simulation
const storesData = {
    "Store A": { "milk": 3.50, "bread": 2.50, "eggs": 4.00, "apples": 1.50, "chicken": 7.00, "rice": 5.00 },
    "Store B": { "milk": 3.60, "bread": 2.40, "eggs": 4.10, "apples": 1.60, "chicken": 6.80, "rice": 4.80 },
    "Value Mart": { "milk": 3.40, "bread": 2.30, "eggs": 3.90, "apples": 1.45, "chicken": 7.20, "rice": 5.10 }
};

// Simple recipe simulation
const recipesData = [
    { name: "Omelette", ingredients: ["eggs", "milk"], steps: "Whisk eggs and milk, cook in a pan." },
    { name: "Chicken and Rice", ingredients: ["chicken", "rice"], steps: "Cook chicken and rice separately, then combine." },
    { name: "Apple Slices", ingredients: ["apples"], steps: "Wash and slice the apples." },
    { name: "French Toast", ingredients: ["bread", "eggs", "milk"], steps: "Soak bread in egg/milk mixture, fry in a pan." }
];

// --- Conversation State ---
let conversationState = {
    budget: null,
    shoppingList: [],
    userName: null // Example of potentially remembering more context
};

// --- Helper Functions ---

// Function to add a message to the chat box
function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');

    const paragraph = document.createElement('p');
    // Basic sanitization to prevent HTML injection - replace with a robust library in production
    paragraph.textContent = text;
    messageElement.appendChild(paragraph);

    chatBox.appendChild(messageElement);
    // Scroll to the bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Function to parse items from text (very basic)
function parseItems(text) {
    // Example: "I need milk, eggs, and bread" -> ["milk", "eggs", "bread"]
    // This is a naive implementation, a real app would need better NLP
    const items = text.toLowerCase()
                      .replace(/i need|add|get|buy|,|and |my list has/g, '') // Remove common phrases/punctuation
                      .split(' ') // Split into words
                      .map(item => item.trim()) // Trim whitespace
                      .filter(item => item.length > 1); // Filter out empty strings or single letters

    // Very basic check against known items (could be expanded)
    const knownItems = ["milk", "bread", "eggs", "apples", "chicken", "rice"];
    return items.filter(item => knownItems.includes(item));
}

// Function to compare prices for items in the shopping list
function comparePrices() {
    if (conversationState.shoppingList.length === 0) {
        return "Your shopping list is empty. Add some items first!";
    }

    let comparisonText = "Price Comparison:\n";
    conversationState.shoppingList.forEach(item => {
        comparisonText += `\n* ${item.charAt(0).toUpperCase() + item.slice(1)}:\n`;
        let found = false;
        for (const store in storesData) {
            if (storesData[store][item] !== undefined) {
                comparisonText += `  - ${store}: $${storesData[store][item].toFixed(2)}\n`;
                found = true;
            }
        }
         if (!found) {
             comparisonText += `  - Not found in simulated stores.\n`;
         }
    });
    return comparisonText;
}

// Function to find recipes based on the shopping list
function findRecipes() {
    if (conversationState.shoppingList.length === 0) {
        return "Your shopping list is empty. Add items to find recipes.";
    }

    let foundRecipes = [];
    recipesData.forEach(recipe => {
        // Check if all recipe ingredients are in the shopping list
        const hasAllIngredients = recipe.ingredients.every(ingredient =>
            conversationState.shoppingList.includes(ingredient)
        );
        if (hasAllIngredients) {
            foundRecipes.push(recipe);
        }
    });

    if (foundRecipes.length === 0) {
        return "Couldn't find any simple recipes with the items currently on your list (" + conversationState.shoppingList.join(", ") +").";
    }

    let recipeText = "Based on your list ("+ conversationState.shoppingList.join(", ") +"), you could make:\n";
    foundRecipes.forEach(recipe => {
        recipeText += `\n* ${recipe.name}:\n  - Needs: ${recipe.ingredients.join(", ")}\n`; // Optionally add steps: ${recipe.steps}
    });
    return recipeText;
}

// Function to generate a very simple meal plan (placeholder)
function generateMealPlan() {
     if (conversationState.shoppingList.length < 2) {
        return "Add a few more items to your list, and I can try to suggest a simple meal plan.";
    }
    // Extremely basic example: suggests the first recipe found
    const recipes = recipesData.filter(recipe => recipe.ingredients.every(ing => conversationState.shoppingList.includes(ing)));

    if(recipes.length > 0){
        return `Simple Meal Idea: How about making ${recipes[0].name}? You have the ingredients: ${recipes[0].ingredients.join(", ")}. Remember your budget is ${conversationState.budget ? '$'+conversationState.budget : 'not set'}.`;
    } else {
        return "I can't seem to make a meal plan from your current list. Maybe add eggs or milk?";
    }
}


// --- Main Logic ---

// Function to process user input and generate bot response
function getBotResponse(userInputText) {
    const lowerCaseText = userInputText.toLowerCase();
    let botResponse = "I'm sorry, I didn't quite understand that. You can tell me your budget, add items, ask for price comparisons, recipes, or a meal plan."; // Default fallback

    // 1. Check for budget setting
    const budgetMatch = lowerCaseText.match(/budget is \$?(\d+(\.\d{1,2})?)/);
    if (budgetMatch) {
        conversationState.budget = parseFloat(budgetMatch[1]);
        botResponse = `Okay, budget set to $${conversationState.budget.toFixed(2)}. What items are on your shopping list?`;
        return botResponse; // Early return as budget is set
    }
    if (lowerCaseText.includes("what is my budget")) {
        return conversationState.budget ? `Your current budget is $${conversationState.budget.toFixed(2)}.` : "You haven't set a budget yet.";
    }
     if (lowerCaseText.includes('budget')) {
        return "What is your total budget for this shopping trip? (e.g., 'My budget is $50')";
    }


    // 2. Check for adding items
    const itemsToAdd = parseItems(lowerCaseText);
    if (itemsToAdd.length > 0) {
        // Add only new items to avoid duplicates
        let newItems = [];
        itemsToAdd.forEach(item => {
            if (!conversationState.shoppingList.includes(item)) {
                conversationState.shoppingList.push(item);
                newItems.push(item);
            }
        });
        if (newItems.length > 0) {
            botResponse = `Added ${newItems.join(', ')} to your list. Your list now: ${conversationState.shoppingList.join(', ')}. Anything else?`;
        } else {
             botResponse = `Those items seem to already be on your list: ${conversationState.shoppingList.join(', ')}. Need anything else?`;
        }
         return botResponse;
    }
     if (lowerCaseText.includes('my list') || lowerCaseText.includes('shopping list')) {
         return conversationState.shoppingList.length > 0 ? `Your current list is: ${conversationState.shoppingList.join(', ')}.` : "Your shopping list is currently empty.";
     }
      if (lowerCaseText.includes('item') || lowerCaseText.includes('need') || lowerCaseText.includes('buy') || lowerCaseText.includes('add')) {
         // Generic prompt if items keywords are used but nothing specific parsed
         return "What items do you need to add? (e.g., 'Add milk and bread')";
     }


    // 3. Check for specific commands
    if (lowerCaseText.includes('compare prices') || lowerCaseText.includes('how much') || lowerCaseText.includes('find deals')) {
        botResponse = comparePrices();
    } else if (lowerCaseText.includes('recipe') || lowerCaseText.includes('make with') || lowerCaseText.includes('cook')) {
        botResponse = findRecipes();
    } else if (lowerCaseText.includes('meal plan') || lowerCaseText.includes('plan meals')) {
        botResponse = generateMealPlan();
    } else if (lowerCaseText.includes('hello') || lowerCaseText.includes('hi')) {
        botResponse = "Hello! How can I help with your grocery planning today?";
    } else if (lowerCaseText.includes('thank')) {
        botResponse = "You're welcome! Happy budgeting!";
    } else if (lowerCaseText.includes('clear') || lowerCaseText.includes('reset')) {
        conversationState = { budget: null, shoppingList: [] }; // Reset state
        botResponse = "Okay, I've cleared your budget and shopping list. Let's start fresh!";
    }


    return botResponse;
}

// Function to handle sending a message
function sendMessage() {
    const text = userInput.value.trim();
    if (text === '') return; // Don't send empty messages

    // Display user message
    addMessage(text, 'user');

    // Clear input
    userInput.value = '';

    // Get and display bot response
    const botResponse = getBotResponse(text);

    // Simulate thinking time
    setTimeout(() => {
        addMessage(botResponse, 'bot');
    }, 600);
}

// Event listeners
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', function(event) {
    // Check if Enter key was pressed
    if (event.key === 'Enter') {
        // Prevent default form submission if it were in a form
        event.preventDefault();
        sendMessage();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const weeklyBudgetInput = document.getElementById('weekly-budget');
    const budgetProduceInput = document.getElementById('budget-produce');
    const budgetProteinInput = document.getElementById('budget-protein');
    const budgetPantryInput = document.getElementById('budget-pantry');
    const budgetOtherInput = document.getElementById('budget-other');
    const preferencesInput = document.getElementById('preferences');
    const planButton = document.getElementById('plan-button');
    const loadingIndicator = document.getElementById('loading-indicator');
    const mealPlanOutput = document.getElementById('meal-plan-output');
    const shoppingListOutput = document.getElementById('shopping-list-output');
    const savingsTipsOutput = document.getElementById('savings-tips-output');

    // --- Event Listener ---
    planButton.addEventListener('click', generatePlan);

    // --- Core Function ---
    async function generatePlan() {
        // 1. Get Inputs
        const budget = weeklyBudgetInput.value.trim();
        const produceBudget = budgetProduceInput.value.trim();
        const proteinBudget = budgetProteinInput.value.trim();
        const pantryBudget = budgetPantryInput.value.trim();
        const otherBudget = budgetOtherInput.value.trim();
        const preferences = preferencesInput.value.trim();

        if (!budget) {
            alert("Please enter your total weekly budget.");
            return;
        }

        // 2. Show Loading & Clear Outputs
        loadingIndicator.classList.remove('hidden');
        planButton.disabled = true;
        mealPlanOutput.innerHTML = '<p class="text-center text-gray-500">Generating meal plan...</p>';
        shoppingListOutput.innerHTML = '<p class="text-center text-gray-500">Generating shopping list...</p>';
        savingsTipsOutput.innerHTML = '<p class="text-center text-gray-500">Generating tips...</p>';

        // 3. Construct Prompt for Gemini API
        let prompt = `You are an AI assistant helping an Indian user plan their weekly groceries. \n\n        User's Total Weekly Budget: INR ${budget}\n        `;

        // Add budget breakdown if provided
        if (produceBudget || proteinBudget || pantryBudget || otherBudget) {
            prompt += `\nBudget Breakdown (Optional):\n            - Produce: INR ${produceBudget || 'Not specified'}\n            - Proteins (Dal, Eggs, Paneer, etc.): INR ${proteinBudget || 'Not specified'}\n            - Pantry (Rice, Atta, Spices, Oil, etc.): INR ${pantryBudget || 'Not specified'}\n            - Other (Dairy, Snacks, etc.): INR ${otherBudget || 'Not specified'}\n            `;
        }

        if (preferences) {
            prompt += `\nUser Preferences/Needs: ${preferences}\n            `;
        }

        prompt += `\nPlease generate the following, specifically tailored for the Indian context and budget:\n\n        1.  **Weekly Meal Suggestions:** Provide a simple 7-day meal plan (Breakfast, Lunch, Dinner) using common, budget-friendly Indian dishes that fit within the specified budget. Keep recipes simple and practical for home cooking.\n        2.  **Shopping List:** Create a detailed grocery shopping list based *only* on the ingredients needed for the suggested meal plan. Estimate the cost for each item in INR, considering prices at budget stores like D-Mart or local markets. Sum up the estimated total cost.\n        3.  **Cost-Saving Tips:** Offer 3-5 practical grocery cost-saving tips relevant to the Indian market and the user's plan/budget.\n\n        Format the output clearly with headings for each section (Meal Suggestions, Shopping List, Cost-Saving Tips). For the shopping list, use bullet points with item, quantity (approx.), and estimated INR cost. Example: \"- Rice (1kg): ₹60\".\n        `;

        // 4. Call Gemini API
        try {
            const requestBody = {
                contents: [{
                    parts: [{
                        text: prompt
                    }
                    ]
                }],
                // Optional: Add generationConfig for safety settings, temperature etc.
                // generationConfig: {
                //   temperature: 0.7,
                //   topK: 1,
                //   topP: 1,
                //   maxOutputTokens: 2048, 
                // },
                // Optional: Add safetySettings if needed
                // safetySettings: [
                //   { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                //   { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
                // ]
            };

            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error Response:", errorData);
                throw new Error(`API request failed with status ${response.status}: ${errorData?.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();

            // 5. Process and Display Response
            if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
                const generatedText = data.candidates[0].content.parts[0].text;
                // Basic parsing (assumes Gemini follows the formatting request)
                // More robust parsing might be needed
                const mealPlanMatch = generatedText.match(/Weekly Meal Suggestions([\s\S]*?)(Shopping List|Cost-Saving Tips|$)/i);
                const shoppingListMatch = generatedText.match(/Shopping List([\s\S]*?)(Cost-Saving Tips|Weekly Meal Suggestions|$)/i);
                const tipsMatch = generatedText.match(/Cost-Saving Tips([\s\S]*?)(Weekly Meal Suggestions|Shopping List|$)/i);

                mealPlanOutput.innerHTML = mealPlanMatch ? formatOutput(mealPlanMatch[1]) : '<p>Could not extract meal plan.</p>';
                shoppingListOutput.innerHTML = shoppingListMatch ? formatOutput(shoppingListMatch[1]) : '<p>Could not extract shopping list.</p>';
                savingsTipsOutput.innerHTML = tipsMatch ? formatOutput(tipsMatch[1]) : '<p>Could not extract saving tips.</p>';

            } else {
                console.error("Invalid API response structure:", data);
                throw new Error('Received an invalid response structure from the API.');
            }

        } catch (error) {
            console.error("Error generating plan:", error);
            mealPlanOutput.innerHTML = `<p class="text-red-600">Error: ${error.message}. Check console for details.</p>`;
            shoppingListOutput.innerHTML = `<p class="text-red-600">Failed to generate.</p>`;
            savingsTipsOutput.innerHTML = `<p class="text-red-600">Failed to generate.</p>`;
        } finally {
            // 6. Hide Loading
            loadingIndicator.classList.add('hidden');
            planButton.disabled = false;
        }
    }

    // --- Helper Function to Format Output --- (Basic formatting)
    function formatOutput(text) {
        // Convert markdown-like lists and bold text to HTML
        let html = text
            .trim()
            .replace(/^\s*[\*-]\s+/gm, '<li class="ml-4 mb-1">') // Basic bullet points
            .replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>') // Bold text
            .replace(/\n/g, '<br>'); // Newlines to <br>

        // Wrap list items if needed (simple approach)
        if (html.includes('<li')) {
             html = `<ul class="list-disc pl-5 space-y-1">${html}</ul>`;
             // Fix potential double nesting if lists were already wrapped partially
             html = html.replace(/<\/li><li>/g,'</li><li class="ml-4 mb-1">');
        }

        // Simple check for headings (e.g., Day 1:) - could be more robust
        html = html.replace(/^(\w+\s*\d+:)/gm, '<br><strong>$1</strong>');

        return html;
    }

}); // End DOMContentLoaded 
