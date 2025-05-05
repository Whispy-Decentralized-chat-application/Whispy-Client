import { OrbisDB } from "@useorbis/db-sdk"

export const db = new OrbisDB({
    ceramic: {
        gateway: "http://localhost:7007"
    },
    nodes: [
        {
            gateway: "http://localhost:7008"
        }
    ]
})

export const models = {
    chat: "kjzl6hvfrbw6c9bkr3ziu8c0gfqy5rx35youb479htemtmngsyl4yofzkb9idyr",
    community: "kjzl6hvfrbw6c8nox3bnar5sqat63plspjqnej7ad4zoov8952hfuwuxz1xcdux",
    user: "kjzl6hvfrbw6c5knx9o8v9nsvosx754tk445qw0fkmrord48xariyo37374w42c",
    message: "kjzl6hvfrbw6c8aswcusrigimbcmuutb2wglh1n0d48wrthbvkd7tgw43w3y9mq",
    chat_membership: "kjzl6hvfrbw6c96ay1rq9lrhphbucxp50v1nt9f0qiekmuz3xisuj5dodbz7wiu",
    relationship: "kjzl6hvfrbw6caqpydfv3pha16j2xwazbpiul8ngwhqp9k96bgmiwwd5ooja2y1",
    post: "kjzl6hvfrbw6c5txohxkrzmtqvluidud2r4v4wm6jx1wwh84igj1gy0ci8jn0hk",
    reply: "kjzl6hvfrbw6c5pyb21urezl2fq63yv8stjl3c084pgywyuqdkn5606nngdlidu",
    report: "kjzl6hvfrbw6c8w03cwe36w50h9nor6b1fskkbq8xto7sic3sufxgl1zubhif86"  
}

export const contexts = {
    whispy_test: "kjzl6kcym7w8y4wk8z1hlf0rxomnejtoe1ybij5f9ohgpiwx0z2ta5wu8h5z0t6",
    whispy: "kjzl6kcym7w8y8jojqu7vvjph34wg8eophkm74veapqcpzceen0aeljxb7w3psr"
}

export const getMe = async (): Promise<any> => {
    const orbisSession = await db.getConnectedUser()
    if (!orbisSession) throw new Error("No hay sesión de usuario activa")
    const myDid = orbisSession.user.did
    try {
        const result = await db
        .select()
        .from(models.user)
        .where({ controller: myDid })
        .context(contexts.whispy_test)
        .run()
    
        return result.rows[0]
    } catch (error) {
        console.error("Error al obtener el perfil:", error)
        throw new Error("Error al obtener el perfil")
    }
}

export const registerUser = async (userName: string): Promise<any> => {
    console.log("Registrando usuario en OrbisDB")
    await db.getConnectedUser();
    const user = {
        username: userName,
        isPrivate: false,
        bio: ""
    }
    const result = await db
    .insert(models.user)
    .value(user)
    .context(contexts.whispy_test)
    .run()
}

export const retrieveMyChats = async () => {
    const userId = localStorage.getItem("orbis:user") ? JSON.parse(localStorage.getItem("orbis:user")!)["stream_id"] : null;

    const chatModel = models.chat;
    const chatMembershipModel = models.chat_membership;
    const { columns, rows } = await db
    .select()
    .raw(
        `
        SELECT c.*
        FROM "${chatModel}" AS c
        JOIN "${chatMembershipModel}" AS cm
            ON cm."chatId"   = c.stream_id
        WHERE cm."userId" = $1;

        `,
        [userId]
    )
    .run();

    console.log("Chats para test_user:", rows);
    return rows;

};

export const createChat = async (chatName: string, members: string[]) => {
   
    try {
        const userId = localStorage.getItem("orbis:user") ? JSON.parse(localStorage.getItem("orbis:user")!)["stream_id"] : null;
        console.log("User ID:", userId);
        await db.getConnectedUser();

        members.push(userId); // Agregar el creador del chat a la lista de miembros

        const chatData = {
            title: chatName,
            creator: userId,
            admins: [userId],
            creationDate: new Date().toISOString()
        };

        const insertedChat = await db.insert(models.chat)
            .value(chatData)
            .context(contexts.whispy_test)
            .run();
        console.log("Chat created successfully:", insertedChat);

        for (const member of members) {

            const chat_membershipData = {
                chatId: insertedChat.id,
                userId: member
            };

            const insertedMembership = await db.insert(models.chat_membership)
                .value(chat_membershipData)
                .context(contexts.whispy_test)
                .run();
            console.log("Chat membership created successfully:", insertedMembership);
        }
        console.log("All memberships created successfully");

    } catch (error) {
        console.error("Error creating chat:", error);
    }
}