import express from 'express';
import multer from 'multer';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { CSVLoader } from '@langchain/community/document_loaders/fs/csv';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { RetrievalQAChain } from 'langchain/chains';
import { modelManager } from '../config/models.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.csv', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 存储向量数据库实例
const vectorStores = new Map();

/**
 * 上传并处理文档
 */
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    const { chunkSize = 1000, chunkOverlap = 200 } = req.body;
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    // 根据文件类型选择加载器
    let loader;
    switch (fileExt) {
      case '.pdf':
        loader = new PDFLoader(filePath);
        break;
      case '.txt':
      case '.md':
        loader = new TextLoader(filePath);
        break;
      case '.csv':
        loader = new CSVLoader(filePath);
        break;
      default:
        return res.status(400).json({ error: '不支持的文件类型' });
    }

    // 加载文档
    const docs = await loader.load();
    
    // 分割文档
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: parseInt(chunkSize),
      chunkOverlap: parseInt(chunkOverlap),
    });
    const splitDocs = await textSplitter.splitDocuments(docs);

    // 创建向量存储
    if (process.env.OPENAI_API_KEY) {
      const embeddings = new OpenAIEmbeddings();
      const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);
      
      // 存储向量数据库实例
      const documentId = req.file.filename;
      vectorStores.set(documentId, vectorStore);

      res.json({
        success: true,
        data: {
          documentId,
          filename: req.file.originalname,
          chunks: splitDocs.length,
          totalCharacters: splitDocs.reduce((sum, doc) => sum + doc.pageContent.length, 0)
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          documentId: req.file.filename,
          filename: req.file.originalname,
          chunks: splitDocs.length,
          totalCharacters: splitDocs.reduce((sum, doc) => sum + doc.pageContent.length, 0),
          warning: '未配置 OpenAI API Key，无法创建向量索引'
        }
      });
    }

  } catch (error) {
    console.error('文档上传错误:', error);
    res.status(500).json({
      error: '文档处理失败',
      message: error.message
    });
  }
});

/**
 * 基于文档的问答
 */
router.post('/qa', async (req, res) => {
  try {
    const { documentId, question, model = 'default' } = req.body;

    if (!documentId || !question) {
      return res.status(400).json({ error: '文档ID和问题不能为空' });
    }

    const vectorStore = vectorStores.get(documentId);
    if (!vectorStore) {
      return res.status(404).json({ error: '文档不存在或未建立索引' });
    }

    // 获取模型
    const modelName = model === 'default' ? modelManager.getDefaultModel() : model;
    const chatModel = modelManager.getModel(modelName);

    // 创建检索问答链
    const chain = RetrievalQAChain.fromLLM(chatModel, vectorStore.asRetriever());
    
    const response = await chain.call({
      query: question,
    });

    res.json({
      success: true,
      data: {
        answer: response.text,
        question,
        documentId,
        model: modelName
      }
    });

  } catch (error) {
    console.error('文档问答错误:', error);
    res.status(500).json({
      error: '文档问答失败',
      message: error.message
    });
  }
});

/**
 * 搜索文档内容
 */
router.post('/search', async (req, res) => {
  try {
    const { documentId, query, k = 4 } = req.body;

    if (!documentId || !query) {
      return res.status(400).json({ error: '文档ID和查询内容不能为空' });
    }

    const vectorStore = vectorStores.get(documentId);
    if (!vectorStore) {
      return res.status(404).json({ error: '文档不存在或未建立索引' });
    }

    // 相似性搜索
    const results = await vectorStore.similaritySearch(query, parseInt(k));

    res.json({
      success: true,
      data: {
        query,
        results: results.map((doc, index) => ({
          index,
          content: doc.pageContent,
          metadata: doc.metadata,
          score: doc.score || null
        }))
      }
    });

  } catch (error) {
    console.error('文档搜索错误:', error);
    res.status(500).json({
      error: '文档搜索失败',
      message: error.message
    });
  }
});

/**
 * 获取已上传的文档列表
 */
router.get('/', (req, res) => {
  try {
    const documents = Array.from(vectorStores.keys()).map(documentId => ({
      documentId,
      hasVectorIndex: true,
      uploadTime: new Date().toISOString() // 实际项目中应该从数据库获取
    }));

    res.json({
      success: true,
      data: {
        documents,
        total: documents.length
      }
    });

  } catch (error) {
    console.error('获取文档列表错误:', error);
    res.status(500).json({
      error: '获取文档列表失败',
      message: error.message
    });
  }
});

/**
 * 删除文档
 */
router.delete('/:documentId', (req, res) => {
  try {
    const { documentId } = req.params;
    
    if (vectorStores.has(documentId)) {
      vectorStores.delete(documentId);
      
      // 删除文件
      const filePath = path.join('uploads/documents', documentId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({
        success: true,
        message: '文档删除成功'
      });
    } else {
      res.status(404).json({
        error: '文档不存在'
      });
    }

  } catch (error) {
    console.error('删除文档错误:', error);
    res.status(500).json({
      error: '删除文档失败',
      message: error.message
    });
  }
});

export default router;
