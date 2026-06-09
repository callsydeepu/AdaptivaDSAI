from groq import Groq

client = Groq(api_key="YOUR_KEY")

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {
            "role": "user",
            "content": "Explain machine learning in one sentence."
        }
    ]
)

print(response.choices[0].message.content)