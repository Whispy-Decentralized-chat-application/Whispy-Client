import { OrbisDB } from "@useorbis/db-sdk"
import { request } from "http"
import { CgCommunity } from "react-icons/cg"

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
    report: "kjzl6hvfrbw6c8w03cwe36w50h9nor6b1fskkbq8xto7sic3sufxgl1zubhif86",
    friend_event: "kjzl6hvfrbw6cb47msvvz67oa9sn4qstv6xtxknuxt139t28sm9kdz5u6di67qd",
    community_membership: "kjzl6hvfrbw6c8pfql1t5a5g9bz4j9pooblj4fiaqp9d6xp3tip4aimpn2x7mti"
}

export const contexts = {
    whispy_test: "kjzl6kcym7w8y4wk8z1hlf0rxomnejtoe1ybij5f9ohgpiwx0z2ta5wu8h5z0t6",
    whispy: "kjzl6kcym7w8y8jojqu7vvjph34wg8eophkm74veapqcpzceen0aeljxb7w3psr"
}

export const isBcAddress = (value: string): boolean => {
    return /^0x[0-9a-fA-F]{40}$/.test(value)
}


export const isStreamId = (value: string): boolean => {
    return /^[a-z0-9]{62}$/.test(value);
  };

