#!/bin/bash

# Production build script for Zeabur deployment

echo "🚀 开始生产环境构建..."

# 1. 安装依赖
echo "📦 安装依赖..."
npm install

# 2. 构建后端
echo "🔧 构建后端服务..."
npm run build:server

# 3. 构建前端
echo "🎨 构建前端..."
npm run build

# 4. 检查构建结果
echo "✅ 检查构建结果..."
if [ -d "api/dist" ] && [ -d "dist" ]; then
    echo "✅ 构建成功！"
    echo "📁 后端构建文件: api/dist/"
    echo "📁 前端构建文件: dist/"
else
    echo "❌ 构建失败！"
    exit 1
fi

echo "🎉 构建完成，可以启动生产服务器：npm start"