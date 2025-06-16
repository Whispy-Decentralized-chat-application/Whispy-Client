import { useSession } from "@/context/SessionContext";
import { getChatMembers, getChatMembersComplete } from "./chatService";
import { decryptMessage, encryptMessage } from "./criptoService";
import { contexts, db, models } from "./orbisDB";
import { getUserById } from "./userService";

export const retrieveMessages = async (
    chatStreamId: string,
    myStreamId: string,
    myPrivateKey: JsonWebKey
) => {
    const { rows } = await db
        .select()
        .context(contexts.whispy_test)
        .from(models.message)
        .where({
            chatId: chatStreamId,
            receiver: myStreamId
        })
        .run();

    for (const row of rows) {
        const author = await getUserById(row.author); // ¡Recuerda caché si puedes!
        // author.publicKey debe ser JsonWebKey, si es string haz JSON.parse
        const authorPubKey = typeof author.publicKey === "string" ? JSON.parse(author.publicKey) : author.publicKey;
        row.content = await decryptMessage(row.content, row.iv, authorPubKey, myPrivateKey);
    }
    return rows;
};

export const sendMessage = async (
    content: string,
    chatId: string,
    author: string,
    myPrivateKey: JsonWebKey,
    type: "text" | "image" | "file" | "audio"
) => {
    try {
        await db.getConnectedUser();
        const members = await getChatMembersComplete(chatId);
        for (const member of members) {
            // member.publicKey debe ser objeto, si es string -> JSON.parse
            const receiverPubKey = typeof member.publicKey === "string" ? JSON.parse(member.publicKey) : member.publicKey;
            const { content: encryptedContent, iv } = await encryptMessage(content, receiverPubKey, myPrivateKey);
            const msgObj = {
                author,
                receiver: member.stream_id,
                chatId,
                content: encryptedContent,
                iv,
                msgType: type,
                date: new Date().toISOString(),
            };
            await db.insert(models.message)
                .value(msgObj)
                .context(contexts.whispy_test)
                .run();
        }
    } catch (error) {
        console.error("Error sending message:", error);
    }
};
