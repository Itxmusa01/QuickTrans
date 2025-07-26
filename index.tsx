/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

document.addEventListener('DOMContentLoaded', () => {
  const inputText = document.getElementById('input-text') as HTMLTextAreaElement;
  const translateBtn = document.getElementById('translate-btn') as HTMLButtonElement;
  const loader = document.getElementById('loader') as HTMLDivElement;
  const btnText = translateBtn.querySelector('.btn-text') as HTMLSpanElement;
  const errorContainer = document.getElementById('error-container') as HTMLDivElement;

  const languageSelect = document.getElementById('language-select') as HTMLSelectElement;
  const outputSection = document.getElementById('output-section') as HTMLElement;
  const outputLanguageHeader = document.getElementById('output-language-header') as HTMLElement;
  const translationOutput = document.getElementById('translation-output') as HTMLElement;
  const copyBtn = document.querySelector('.copy-btn') as HTMLButtonElement;


  const setUiLoading = (isLoading: boolean) => {
    translateBtn.disabled = isLoading;
    if (isLoading) {
      loader.classList.remove('hidden');
      btnText.classList.add('hidden');
    } else {
      loader.classList.add('hidden');
      btnText.classList.remove('hidden');
    }
  };

  const showError = (message: string) => {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
  };

  const hideError = () => {
    errorContainer.classList.add('hidden');
  };

  const clearOutput = () => {
    translationOutput.textContent = '';
    outputLanguageHeader.textContent = '';
    outputSection.classList.add('hidden');
  };

  const handleTranslate = async () => {
    const textToTranslate = inputText.value.trim();
    if (!textToTranslate) {
      showError("Please enter some text to translate.");
      return;
    }

    const targetLanguage = languageSelect.value;
    if (!targetLanguage) {
        showError("Please select a target language.");
        return;
    }

    hideError();
    setUiLoading(true);
    clearOutput();

    const translationSchema = {
      type: Type.OBJECT,
      properties: {
        translation: {
          type: Type.STRING,
          description: `The translated text in ${targetLanguage}`
        },
      },
      required: ['translation'],
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Translate the following English text to ${targetLanguage}: "${textToTranslate}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: translationSchema,
          systemInstruction: `You are an expert translator. The user will provide English text and a target language. Translate the text to the specified language. Return the result as a JSON object with a single 'translation' key.`,
        },
      });
      
      const jsonText = response.text.trim();
      const result = JSON.parse(jsonText);

      if (result.translation) {
        outputLanguageHeader.textContent = targetLanguage;
        translationOutput.textContent = result.translation;
        outputSection.classList.remove('hidden');
      } else {
        throw new Error("Invalid response format from API.");
      }

    } catch (error) {
      console.error('Translation error:', error);
      showError('Sorry, an error occurred during translation. Please try again.');
      clearOutput();
    } finally {
      setUiLoading(false);
    }
  };

  const handleCopy = async () => {
    const textToCopy = translationOutput.textContent;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        if (copyBtn.textContent === 'Copied!') {
          copyBtn.textContent = originalText;
        }
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showError("Could not copy text to clipboard.");
    }
  };

  translateBtn.addEventListener('click', handleTranslate);
  copyBtn.addEventListener('click', handleCopy);
});