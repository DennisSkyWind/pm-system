FROM python:3.12-slim

WORKDIR /app

# 安装依赖
RUN pip install --no-cache-dir flask requests

# 复制文件
COPY pm_server.py .
COPY frontend/ ./frontend/
COPY data/pm.db ./data/pm.db

# 创建附件目录
RUN mkdir -p data/attachments

# 环境变量
ENV PM_FRONTEND_DIR=/app/frontend
ENV PM_DB_PATH=/app/data/pm.db
ENV PM_UPLOAD_DIR=/app/data/attachments
ENV PM_PORT=5236

EXPOSE 5236

CMD ["python3", "pm_server.py"]
