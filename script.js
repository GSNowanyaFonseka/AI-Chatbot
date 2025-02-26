const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");


const API_KEY = "AIzaSyBNzAUPDKIOIbo79nmA1jx_sJTgkRdu9gs";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;


const userData = {
    message: null,
    file:{
        data: null,
        mime_type: null
    }
};

const createMessageElement = (content,...classes) => {
    const div = document.createElement("div");
    div.classList.add("message",...classes);
    div.innerHTML = content;
    return div;
};

const generateBotResponse = async(incomingMessageDiv) => {
    const messageElement = incomingMessageDiv.querySelector(".message-text");

    const requestOptions = {
        method: "POST",
        headers: {"Content-type":"application/json"},
        body: JSON.stringify({
            contents:
            [{parts: [
                {text:userData.message}, 
                ...(userData.file.data ? [{inline_data: userData.file}] : [])
            ]
        }]
        })
    };

    try{
        const response = await fetch(API_URL, requestOptions);
        const data = await response.json();

        if(!response.ok) throw new Error(data.error?.message || "Unknown error");

        if (data.candidates && data.candidates.length > 0) {
            const apiResponseText = data.candidates[0].content.parts[0].text
               .replace(/\*\*(.*?)\*\//g, "$1")
               .trim();

            messageElement.innerText = apiResponseText;
        }else{
            messageElement.innerText = "Sorry. I couldn't generate a response.";
        }    
               
    } catch (error){
            console.error("API Error", error);
            messageElement.innerText = "An error occured. Please try again.";
    } finally {

            userData.file = {};
            incomingMessageDiv.classList.remove("thinking");
            chatBody.scrollTo({top: chatBody.scrollHeight, behavior: "smooth"});
    }
};

const handleOutgoingMessage = (e) => {
    e.preventDefault();
    userData.message = messageInput.value.trim();
    if(!userData.message) return;
    messageInput.value = "";
    fileUploadWrapper.classList.remove("file-uploaded");


    const messageContent = `<div class="message-text"></div>
                                    ${userData.file.data ?` <img src="data:${userData.file.mime_type};base64, ${userData.file.data}" class="attachment" />` : "" }`;
    const OutgoingMessageDiv = createMessageElement(messageContent, "user-message","thinking");
    OutgoingMessageDiv.querySelector(".message-text").textContent = userData.message;
    chatBody.appendChild(OutgoingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth"});

    setTimeout(() => {
        const messageContent = `
            <h1>🤖</h1>
            <div class="message-text">
            <div class="thinking-indicator">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
            </div>
            </div>`;

            const incomingMessageDiv = createMessageElement(messageContent, "bot-message");
            chatBody.appendChild(incomingMessageDiv);
            chatBody.scrollTo({ top: chatBody.scrollHeight, behaviour:"smooth"});

            generateBotResponse(incomingMessageDiv);

        }, 600);
    };
        
    messageInput.addEventListener("keydown", (e) => {
        if(e.key === "Enter" && e.target.value.trim()) {
                handleOutgoingMessage(e);
        }
    });


    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if(!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            fileUploadWrapper.querySelector("img").src = e.target.result;
            fileUploadWrapper.classList.add("file-uploaded");
            const base64String = e.target.result.split(",")[1];

            userData.file = {
                data: base64String,
                mime_type: file.type
            }

            fileInput.value = "";
        }

        reader.readAsDataURL(file);
    
});

sendMessageButton.addEventListener("click", handleOutgoingMessage);
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());


fileCancelButton.addEventListener("click" , () => {
    userData.file = {}
    fileUploadWrapper.classList.remove("file-uploaded");
});


const picker = new EmojMart.Picker({
    theme: "light",
    skinTonePosition: "none",
    previewPosition: "none",
    onEmojiSelect:(emoji) => {
        const { selectionStart: start, selectionEND: end} = messageInput;
        messageInput.setRangeText(emoji.native, start,end, "end");
        messageInput.focus();

        },

        onClickOutside: (e) => {
            if(e.target.id === "emoji-picker"){
                document.body.classList.toggle("show-emoji-picker");
            }else{
                document.body.classList.remove("show-emoji-picker")
            }
        }

});

document.querySelector(".chat-form").appendChild(picker);


