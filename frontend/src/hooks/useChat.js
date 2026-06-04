import { useState } from "react";

export function useChat() {
  const [messages, setMessages] = useState([
    {
      id: "init",
      isAi: true,
      content: "Hello! I've indexed your **active_users_q4.csv** dataset. I noticed some significant trends in user churn and regional revenue distribution.",
      subContent: "How can I assist you today?",
      suggestions: [
        "Show me churn statistics",
        "Clean missing data",
        "Predict Q1 growth"
      ]
    },
    {
      id: "user-init",
      isAi: false,
      content: "Could you explain why the revenue in the 'West' region seems higher than the 'East' despite lower user counts?"
    },
    {
      id: "ai-res-1",
      isAi: true,
      content: "That's an insightful observation. After running a quick variance analysis, here's what the data suggests:",
      chart: {
        title: "ARPU Comparison",
        items: [
          { label: "West: $1,240 ARPU", percent: 80, isAccent: true },
          { label: "East: $540 ARPU", percent: 40, isAccent: false }
        ]
      },
      textBlock: "The \"West\" region has a significantly higher **Average Revenue Per User (ARPU)**. While the user count is 35% lower, the transaction density is 2.4x higher. This suggests a more mature or enterprise-heavy user base in that segment.",
      code: "df.groupby('region')['revenue'].agg(['mean', 'count', 'sum'])"
    }
  ]);

  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = (text) => {
    if (!text.trim()) return;

    // Add user message
    const userMsgId = `user-${Date.now()}`;
    const newMessages = [
      ...messages,
      {
        id: userMsgId,
        isAi: false,
        content: text
      }
    ];
    setMessages(newMessages);
    setInputVal("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      setIsTyping(false);
      
      let aiResponse = {
        id: `ai-${Date.now()}`,
        isAi: true,
        content: `I've analyzed the query: "${text}". Based on the loaded active_users_q4.csv context, the data correlation indicates a positive coefficient of 0.82 between marketing spend and lifetime conversion ratios. Let me know if you would like me to generate a model config or execute data normalization.`
      };

      if (text.toLowerCase().includes("churn")) {
        aiResponse = {
          id: `ai-${Date.now()}`,
          isAi: true,
          content: "Here are the churn statistics for the active users. The overall user attrition is stable at 2.4% weekly, with a concentration in the basic pricing tiers.",
          code: "churn_rate = df[df['churn_label'] == 1].shape[0] / df.shape[0]\nprint(f'Churn Rate: {churn_rate:.2%}')"
        };
      } else if (text.toLowerCase().includes("clean")) {
        aiResponse = {
          id: `ai-${Date.now()}`,
          isAi: true,
          content: "Successfully imputed the missing revenue fields using the median region values. I've also normalise the skewed distributions using Z-Score scaling.",
          textBlock: "Schema health quality score has increased from 98.4% to 99.1%. All null pointers are now resolved."
        };
      } else if (text.toLowerCase().includes("growth") || text.toLowerCase().includes("predict")) {
        aiResponse = {
          id: `ai-${Date.now()}`,
          isAi: true,
          content: "Predicting Q1 growth trends using LightGBM. The baseline projections estimate a +12.4% lift in transaction volume under standard operational parameters.",
          chart: {
            title: "Projected Growth Speed",
            items: [
              { label: "Q1 Growth (Optimized): +12.4%", percent: 90, isAccent: true },
              { label: "Q1 Growth (Baseline): +4.2%", percent: 30, isAccent: false }
            ]
          }
        };
      }

      setMessages(prev => [...prev, aiResponse]);
    }, 2000);
  };

  return {
    messages,
    inputVal,
    setInputVal,
    isTyping,
    sendMessage
  };
}
