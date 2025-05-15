import { contexts, db, models } from "./orbisDB"

const parseToDid = (address: string): string => {
    // Asegurarse de que la dirección empiece por "0x"
    const normalized = address.startsWith("0x") ? address : `0x${address}`;
    return `did:pkh:eip155:1:${normalized}`;
};


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

export const getUserByBcAdress = async (bc_adress: string): Promise<any> => {
    const orbisSession = await db.getConnectedUser()
    if (!orbisSession) throw new Error("No hay sesión de usuario activa")
    const did = parseToDid(bc_adress)
    try {
        const result = await db
        .select()
        .from(models.user)
        .where({ controller: did })
        .context(contexts.whispy_test)
        .run()
    
        return result.rows[0]
    } catch (error) {
        console.error("Error al obtener el perfil:", error)
        throw new Error("Error al obtener el perfil")
    }
}

export const getUserByUsername = async (username: string): Promise<any> => {
    const orbisSession = await db.getConnectedUser()
    if (!orbisSession) throw new Error("No hay sesión de usuario activa")
    try {
        const result = await db
        .select()
        .from(models.user)
        .where({ username: username })
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