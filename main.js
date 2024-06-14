// IMPORTAR DEPENDENCIAS
import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

// SELECTORES para Componentes
const $ = el => document.querySelector(el);

const $form = $('form');
const $input = $('input');
const $template = $('#message-template');
const $messages = $('ul');
const $container = $('main');
const $button = $('button');
const $info = $('small');

let messages = [];

// Modelo de IA del github: https://github.com/mlc-ai/web-llm/blob/main/src/config.ts
const SELECTED_MODEL = "gemma-2b-it-q4f16_1-MLC";

// CREACION MOTOR IA
const engine = await CreateMLCEngine(SELECTED_MODEL, {
    initProgressCallback: (info) => {
        console.log('initProgressCallback', info);
        $info.textContent = `${info.text}%`;
        if (info.progress === 1) {
            $button.removeAttribute('disabled');
            $info.textContent = ''; // Clear the loading info once ready
        }
    }
});

// Añadir mensaje de contexto en español


// MÉTODOS
$form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const messageText = $input.value.trim();

    if (messageText !== '') {
        addMessage(messageText, 'user');
        messages.push({ role: 'user', content: messageText });
        $input.value = '';
        $button.setAttribute('disabled', true);

        const chunks = await engine.chat.completions.create({
            messages: messages,
            stream: true
        });

        let reply = "";
        const $botMessage = addMessage('', 'bot');

        for await (const chunk of chunks) {
            const [choice] = chunk.choices;
            const content = choice?.delta?.content ?? "";
            reply += content;
            $botMessage.querySelector('p').textContent = reply;
        }

        $button.removeAttribute('disabled');
        messages.push({
            role: 'assistant',
            content: reply,
        });
        
    }
});

$input.addEventListener('input', () => {
    if ($input.value.trim() !== '') {
        $button.removeAttribute('disabled');
    } else {
        $button.setAttribute('disabled', true);
    }
});

function addMessage(text, sender) {
    // Clonar template
    const clonedTemplate = $template.content.cloneNode(true);
    const $newMessage = clonedTemplate.querySelector('.message');

    const $who = $newMessage.querySelector('span');
    const $text = $newMessage.querySelector('p');

    $text.textContent = text;
    $who.textContent = sender === 'bot' ? 'GPT' : 'User';
    $newMessage.classList.add(sender);

    // Añadir el nuevo mensaje al contenedor de mensajes
    $messages.appendChild($newMessage);

    // Actualizar el scroll para ir bajando
    $container.scrollTop = $container.scrollHeight;

    return $newMessage;
}