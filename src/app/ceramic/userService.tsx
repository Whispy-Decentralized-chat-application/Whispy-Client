import { encryptWithPassword, generateKeyPair } from "./criptoService";
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

export const getUserById = async (userId: string): Promise<any> => {
    const orbisSession = await db.getConnectedUser()
    if (!orbisSession) throw new Error("No hay sesión de usuario activa")
    try {
        const result = await db
        .select()
        .from(models.user)
        .where({ stream_id: userId })
        .context(contexts.whispy_test)
        .run()
        console.log("Resultado de la consulta:", result)
        return result.rows[0]
    } catch (error) {
        console.error("Error al obtener el perfil:", error)
        throw new Error("Error al obtener el perfil")
    }
}

export const registerUser = async (userName: string, password: string): Promise<any> => {
    console.log("Registrando usuario en OrbisDB")
    await db.getConnectedUser();

    const { publicKey, privateKey } = await generateKeyPair();

    const encriptedPrivateKey = await encryptWithPassword(privateKey, password);
    localStorage.setItem("orbis:key", encriptedPrivateKey);

    const user = {
        username: userName,
        isPrivate: false,
        bio: "",
        publicKey: publicKey
    }

    try {

        const result = await db
        .insert(models.user)
        .value(user)
        .context(contexts.whispy_test)
        .run()

        console.log("Usuario registrado exitosamente:", result);

        const localuser = await getMe();
        localStorage.setItem("orbis:user", JSON.stringify(localuser));
    
        return privateKey;
    } catch (error) {
        console.error("Error al registrar el usuario:", error);
        throw new Error("Error al registrar el usuario");
    }

}

export const searchUsersByUsername = async (username: string) => {
    const userModel = models.user
    const { columns, rows } = await db
        .select()
        .context(contexts.whispy_test)
        .raw(
            `
            SELECT *
            FROM "${userModel}"
            WHERE username ILIKE $1;
            `,
            [`%${username}%`]
        )
        .run()

    return rows
}

