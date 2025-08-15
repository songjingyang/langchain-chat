/*
 * LangChain 简单翻译应用
 * 基于官方教程：https://js.langchain.com/docs/tutorials/llm_chain
 * 功能：将英文文本翻译成其他语言
 */

import "dotenv/config";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";

// 初始化聊天模型
const model = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0,
});

// 创建提示模板
const systemTemplate = "Translate the following from English into {language}";
const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemTemplate],
  ["user", "{text}"],
]);

// 基本翻译函数
async function translateText(text, language) {
  try {
    // 使用提示模板格式化输入
    const promptValue = await promptTemplate.invoke({
      language: language,
      text: text,
    });

    // 调用模型进行翻译
    const response = await model.invoke(promptValue);
    return response.content;
  } catch (error) {
    console.error("翻译过程中出现错误:", error);
    throw error;
  }
}

// 流式翻译函数
async function translateTextStream(text, language) {
  try {
    const promptValue = await promptTemplate.invoke({
      language: language,
      text: text,
    });

    console.log(`正在翻译 "${text}" 到 ${language}...`);

    const stream = await model.stream(promptValue);
    let result = "";

    for await (const chunk of stream) {
      process.stdout.write(chunk.content);
      result += chunk.content;
    }

    console.log("\n"); // 换行
    return result;
  } catch (error) {
    console.error("流式翻译过程中出现错误:", error);
    throw error;
  }
}

// 直接使用消息的翻译函数（不使用模板）
async function translateWithMessages(text, language) {
  const messages = [
    new SystemMessage(`Translate the following from English into ${language}`),
    new HumanMessage(text),
  ];

  const response = await model.invoke(messages);
  return response.content;
}

// 示例使用
async function runExamples() {
  console.log("=== LangChain 翻译应用示例 ===\n");

  try {
    // 示例1: 基本翻译
    console.log("1. 基本翻译:");
    const result1 = await translateText("Hello, how are you?", "Chinese");
    console.log(`翻译结果: ${result1}\n`);

    // 示例2: 流式翻译
    console.log("2. 流式翻译:");
    await translateTextStream("Good morning! Have a great day!", "Spanish");
    console.log();

    // 示例3: 使用消息直接翻译
    console.log("3. 直接消息翻译:");
    const result3 = await translateWithMessages(
      "Thank you very much!",
      "French"
    );
    console.log(`翻译结果: ${result3}\n`);

    // 示例4: 多种语言翻译
    console.log("4. 多语言翻译:");
    const languages = ["Italian", "German", "Japanese"];
    const text = "Welcome to our application!";

    for (const lang of languages) {
      const result = await translateText(text, lang);
      console.log(`${lang}: ${result}`);
    }
  } catch (error) {
    console.error("运行示例时出现错误:", error);
  }
}

// 导出函数供其他模块使用
export {
  translateText,
  translateTextStream,
  translateWithMessages,
  model,
  promptTemplate,
};

// 如果直接运行此文件，则执行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples();
}
