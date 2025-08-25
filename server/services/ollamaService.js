const axios = require('axios');

class OllamaService {
  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://ollama:11434';
    this.model = process.env.OLLAMA_MODEL || 'llava:latest';
    console.log(`OllamaService initialized with URL: ${this.baseUrl}, Model: ${this.model}`);
  }

  async analyzeCard(frontImageBuffer, backImageBuffer = null) {
    try {
      console.log('OllamaService.analyzeCard - Starting AI analysis');

      // Convert image to base64
      const frontImageBase64 = frontImageBuffer.toString('base64');
      const backImageBase64 = backImageBuffer ? backImageBuffer.toString('base64') : null;

      // Prepare prompt for card analysis
      const prompt = `Analyze this trading card image and extract the following information in JSON format:
{
  "name": "card name or title",
  "manufacturer": "card manufacturer (Topps, Panini, etc.)",
  "year": "year or season",
  "player": "player or subject name",
  "team": "team name",
  "cardNumber": "card number",
  "series": "series or set name",
  "condition": "estimated condition (Mint, Near Mint, Excellent, etc.)",
  "estimatedValue": "estimated value in dollars (number only)"
}

Focus on text visible on the card. If information is not clearly visible, use "Unknown" for text fields and 0 for numeric fields.`;

      // Send request to Ollama
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        images: backImageBase64 ? [frontImageBase64, backImageBase64] : [frontImageBase64],
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9
        }
      }, {
        timeout: 60000 // 60 second timeout
      });

      // Parse AI response
      const aiResponse = response.data.response;
      console.log('Raw AI response:', aiResponse);

      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      console.log('Parsed AI analysis:', analysis);

      return analysis;

    } catch (error) {
      console.error('Error in OllamaService.analyzeCard:', error);
      throw error;
    }
  }

  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      console.error('Error checking Ollama health:', error);
      return false;
    }
  }
}

module.exports = new OllamaService();