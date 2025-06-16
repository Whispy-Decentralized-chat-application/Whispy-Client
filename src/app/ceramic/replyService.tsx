import { contexts, db, models } from "./orbisDB";

export const replyToPost = async (postId: string, replyContent: string) => {
    const orbisSession = await db.getConnectedUser();
    if (!orbisSession) throw new Error("No hay sesión de usuario activa");
    const userId = orbisSession.user.did;
    try {
        const replyData = {
            content: replyContent,
            postId: postId,
            writer: userId,
        };

        const response = await db.insert(models.reply)
            .value(replyData)
            .context(contexts.whispy_test)
            .run();
        console.log("Reply created successfully:", response);
    } catch (error) {
        console.error("Error creating reply:", error);
    }
}

export const retrieveReplies = async (postId: string) => {
    const { columns, rows } = await db
        .select()
        .context(contexts.whispy_test)
        .from(models.reply)
        .where(
            {
                postId: postId
            }
        )
        .run();
    console.log("Retrieved replies:", rows);
    return rows;
};

export const getNumberOfReplies = async (postId: string) => {
    const { columns, rows } = await db
        .select()
        .context(contexts.whispy_test)
        .from(models.reply)
        .where(
            {
                postId: postId
            }
        )
        .run();
    console.log("Number of replies:", rows.length);
    return rows.length;
}

