/**
 * 评论敏感词过滤
 *
 * 如需扩展词库，只需在 SENSITIVE_WORDS 数组中添加即可。
 * 后续也可迁移到 Vercel Edge Config 实现热更新。
 */

const SENSITIVE_WORDS = [
  '赌博', '博彩', '彩票', '赌场', '下注',
  '黄色', '色情', '成人', '裸', '性爱',
  '毒品', '大麻', '海洛因', '冰毒',
  '枪支', '手枪', '步枪', '弹药',
  '诈骗', '骗钱', '转账', '汇款',
  '贷款', '信用卡', '套现',
  '广告', '推广', '加微信', '加QQ', '联系我',
  '代写', '代考', '论文代',
  'VPN', '翻墙', '梯子',
  '发票', '刻章',
  '裸聊', '约炮', '小姐',
];

/** 检查文本是否包含敏感词，返回命中的词 */
export function checkSensitive(text: string): string | null {
  const lower = text.toLowerCase();
  for (const word of SENSITIVE_WORDS) {
    if (lower.includes(word.toLowerCase())) {
      return word;
    }
  }
  return null;
}
