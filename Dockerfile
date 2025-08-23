# 使用 Node.js 基础镜像
FROM node:22-alpine AS build

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package 文件
COPY package*.json pnpm-lock.yaml ./
COPY tsconfig*.json ./

# 安装依赖
RUN pnpm install

# 复制源代码
COPY . .

# 构建应用（前后端）
RUN pnpm run build:server
RUN pnpm run build

# 生产环境镜像
FROM node:22-alpine AS production

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package 文件
COPY package*.json pnpm-lock.yaml ./

# 只安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 复制构建产物
COPY --from=build /app/dist ./dist
COPY --from=build /app/api/dist ./api/dist
COPY --from=build /app/server.js ./server.js

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8080

# 暴露端口
EXPOSE 8080

# 启动应用
CMD ["node", "server.js"]