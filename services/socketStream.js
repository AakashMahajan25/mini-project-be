// services/chatStream.js

const { triggerChatValidation } = require('../validation/promptsValidation');
const { rawQuery, findAndCountAll, findOne, insertMany, create, updateRecords } = require('../utils/postgresUtils');
const { buildSystemPrompt, streamChatCompletion } = require('../utils/openaiHelper');
const moment = require("moment");

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
  name: "chatStream",
  mixins: [require('../mixins/db.mixin')],

  /**
   * WebSocket settings should be within the settings object.
   */
  settings: {
    io: {
      namespaces: {
        '/chat': {
          authorization: true,
          events: {
            async chatStream(args, ctx) {
              const transaction = await this.$service.db.sequelize.transaction();
              let socket = this;
              try {
                const { message, prompt_id, market: paramMarket = "IN", flag } = args;
                const { user_id } = this.user;
                // Get market from socket property (set during auth) or parameter
                const market = this.market || paramMarket;

                this.$service.logger.info(`Chat stream triggered for prompt_id: ${prompt_id}`);

                const validate = triggerChatValidation.validate({ body: args });
                if (validate.error) {
                  this.$service.logger.info(`stocks > getStockBySearch : Validation Error : ${validate.error.message.replace(/\"/g, '')}`);
                  socket.emit("error", { message: `${validate.error.message.replace(/\"/g, '')}` });
                  socket.disconnect();
                  return;
                }

                const promptResponse = await findOne(this.$service.db['prompts'], { user_id, isActive: true, prompt_id });
                if (!promptResponse) {
                  this.$service.logger.info(`prompts > triggerChat : Prompt does not exist`);
                  socket.emit("error", { message: `Prompt does not exist` });
                  socket.disconnect();
                  return;
                }

                await create(this.$service.db['prompt_history'], { user_id, prompt_id, person: 'user', text: message, type: 'text' }, transaction);

                const promptHistory = await create(this.$service.db['prompt_history'], { user_id, prompt_id, person: 'bot', type: 'text', focus_type: flag }, transaction);

                // Load last 10 messages for conversation context
                const historyResult = await findAndCountAll(
                  this.$service.db['prompt_history'],
                  { user_id, prompt_id, isActive: true },
                  [['prompt_history_id', 'ASC']],
                  {}
                );
                const recentHistory = (historyResult?.rows || []).slice(-10);
                const historyMessages = recentHistory.map(row => ({
                  role: row.person === 'bot' ? 'assistant' : 'user',
                  content: row.text || ''
                }));

                const messages = [
                  { role: 'system', content: buildSystemPrompt(flag) },
                  ...historyMessages,
                  { role: 'user', content: message }
                ];

                let streamData = '';
                await streamChatCompletion(
                  messages,
                  (chunk) => {
                    streamData += chunk;
                    socket.emit("response", { data: chunk });
                  },
                  async (fullText) => {
                    socket.emit("end", { data: [] });
                    socket.disconnect();
                    await updateRecords(
                      this.$service.db['prompt_history'],
                      { text: fullText, link: JSON.stringify([]) },
                      { prompt_history_id: promptHistory.prompt_history_id },
                      transaction
                    );
                    await transaction.commit();
                  }
                );
              } catch (error) {
                await transaction.rollback();
                console.log('error:::::::::::::::', error)
                this.$service.logger.error("Error during streaming:", error);
                socket.emit("error", { message: error || "Internal Server Error" });

              }
            }
          }
        }
      }
    }
  }
};
