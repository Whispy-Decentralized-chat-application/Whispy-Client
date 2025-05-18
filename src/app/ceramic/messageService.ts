import { contexts, db, models } from "./orbisDB";

export const retrieveMessages = async (chatStreamId: string) => {
    const { columns, rows } = await db
        .select()
        .context(contexts.whispy_test)
        .from(models.message)
        .where(
            {
                chatId: chatStreamId
            }
        )
        .run();
    console.log("Retrieved messages:", rows);
    return rows;
};

export const sendMessage = async (message:any) => {
    try {
        const response = await db.insert(models.message)
            .value(message)
            .context(contexts.whispy_test)
            .run();
        console.log("Message sent successfully:", response);
    } catch (error) {
        console.error("Error sending message:", error);
    }
}