#!/bin/bash

# 订单分析 Skill 一键更新脚本
# 使用方法：双击运行或在终端执行 bash update.sh

echo "========================================"
echo "  📊 订单分析 Skill 更新工具"
echo "========================================"
echo ""

SKILL_DIR="/Applications/QClaw.app/Contents/Resources/openclaw/config/skills/ky-data-skill"
WORKSPACE_DIR="$HOME/.qclaw/workspace/ky-data-skill"

# 检查 QClaw 是否在运行
echo "📌 检查 QClaw 状态..."
if pgrep -x "QClaw" > /dev/null; then
    echo "⚠️  QClaw 正在运行，建议先退出 QClaw 再更新"
    echo "   按回车继续更新，或 Ctrl+C 取消..."
    read
fi

echo ""
echo "📥 拉取最新代码..."

# 如果有 git 仓库
if [ -d "$WORKSPACE_DIR/.git" ]; then
    cd "$WORKSPACE_DIR"
    git pull origin main 2>/dev/null || git pull origin master 2>/dev/null
    echo "✅ 代码已更新"
else
    echo "ℹ️  本地非 git 仓库，跳过拉取"
    echo "   如需从 GitHub 更新，请手动 clone"
fi

echo ""
echo "📦 安装依赖..."
cd "$WORKSPACE_DIR"
npm install --silent 2>/dev/null

echo ""
echo "📋 复制到 QClaw skills 目录..."
rm -rf "$SKILL_DIR"
cp -r "$WORKSPACE_DIR" "$SKILL_DIR"

echo ""
echo "========================================"
echo "  ✅ 更新完成！"
echo "========================================"
echo ""
echo "现在可以重新打开 QClaw 使用了"
echo ""
