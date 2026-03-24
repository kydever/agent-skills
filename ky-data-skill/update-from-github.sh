#!/bin/bash

# 订单分析 Skill 一键更新（GitHub 版）
# 使用方法：双击运行

echo "========================================"
echo "  📊 订单分析 Skill 更新工具"
echo "========================================"
echo ""

SKILL_DIR="/Applications/QClaw.app/Contents/Resources/openclaw/config/skills/ky-data-skill"
TEMP_DIR="/tmp/ky-data-skill-update"
GITHUB_REPO="https://github.com/kydever/agent-skills/tree/main/ky-data-skill"

# ⚠️ 请将上面的 YOUR_USERNAME 替换为你的 GitHub 用户名

echo "📌 检查 QClaw 状态..."
if pgrep -x "QClaw" > /dev/null; then
    echo "⚠️  QClaw 正在运行，建议先退出 QClaw 再更新"
    echo "   按回车继续更新，或 Ctrl+C 取消..."
    read
fi

echo ""
echo "📥 从 GitHub 下载最新版本..."

# 清理临时目录
rm -rf "$TEMP_DIR"

# 克隆最新代码
git clone "$GITHUB_REPO" "$TEMP_DIR" --depth 1

if [ $? -ne 0 ]; then
    echo "❌ 下载失败，请检查网络连接或 GitHub 地址"
    exit 1
fi

echo ""
echo "📦 安装依赖..."
cd "$TEMP_DIR"
npm install --silent 2>/dev/null

echo ""
echo "📋 更新 QClaw skills 目录..."
rm -rf "$SKILL_DIR"
cp -r "$TEMP_DIR" "$SKILL_DIR"

# 清理临时文件
rm -rf "$TEMP_DIR"

echo ""
echo "========================================"
echo "  ✅ 更新完成！"
echo "========================================"
echo ""
echo "现在可以重新打开 QClaw 使用了"
echo ""

# 等待用户确认
echo "按回车键退出..."
read
