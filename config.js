// サバンナシミュレーション設定
const simulationConfig = {
    // 動物の移動速度設定（0.1-1.0の範囲、数値が小さいほど遅い）
    animalSpeed: {
        baseSpeed: 0.012,         // 基本移動速度（0.06から0.012に変更、1/5に調整）
        speedMultiplier: 0.5,     // 速度倍率（全体を遅くする）
        
        // 動物種別の速度調整（基本速度に対する倍率）
        byType: {
            "ライオン": 1.2,       // ライオンは少し速い
            "ゾウ": 0.6,          // ゾウは遅い
            "キリン": 0.8,        // キリンは中程度
            "シマウマ": 1.5,      // シマウマは最も速い
            "ハイエナ": 1.0,      // ハイエナは標準
            "ミーアキャット": 1.3, // ミーアキャットは速い
            "トムソンガゼル": 1.6  // トムソンガゼルは最も速い
        },
        
        // 状況別の速度調整
        bySituation: {
            normal: 1.0,          // 通常移動
            hunting: 1.2,         // 狩り中（少し調整）
            escaping: 1.4,        // 逃げ中（少し調整）
            resting: 0.2,         // 休息中（より遅く）
            exploring: 0.6        // 探索中（少し調整）
        }
    },
    
    // 移動関連の設定
    movement: {
        minMoveDistance: 5,       // 最小移動距離
        maxMoveDistance: 30,      // 最大移動距離
        moveCooldown: 3000,       // 移動間隔（ミリ秒）
        pathfindingEnabled: true  // 経路探索の有効/無効
    },
    
    // 思考・行動の設定
    behavior: {
        thinkingInterval: 5000,   // 思考間隔（ミリ秒）
        actionCooldown: 2000,     // 行動間隔（ミリ秒）
        decisionTimeout: 10000    // 決定タイムアウト（ミリ秒）
    }
};

// サバンナの動物たちの詳細な性格設定
const animalPersonalities = [
    // ライオン（6匹 - 2倍に増加）
    {
        name: "レオ",
        type: "ライオン",
        age: 8,
        personality: {
            description: "プライドのリーダー。威厳があり、狩りの名人。家族を守る責任感が強い。",
            traits: {
                aggression: 0.9,      // 攻撃性（0-1）
                energy: 0.8,          // 活動的さ
                sociability: 0.7,     // 社交性
                intelligence: 0.8,    // 知能
                leadership: 0.9       // リーダーシップ
            }
        },
        color: 0xD2691E, // 明るい茶色（ライオン）
        hp: 100,
        maxHp: 100,
        isPredator: true,
        prey: ["シマウマ", "キリン", "トムソンガゼル"],
        dailyRoutine: {
            morning: ["低地草原", "森林"],
            afternoon: ["低地草原", "川"],
            evening: ["低地草原", "丘陵"],
            night: ["丘陵"]
        },
        home: null // 動的に生成
    },
    {
        name: "シンバ",
        type: "ライオン",
        age: 6,
        personality: {
            description: "若いライオン。レオの息子で、将来のリーダー候補。好奇心旺盛で冒険好き。",
            traits: {
                aggression: 0.7,
                energy: 0.9,
                sociability: 0.8,
                intelligence: 0.7,
                leadership: 0.6
            }
        },
        color: 0xD2691E, // 明るい茶色（ライオン）
        hp: 80,
        maxHp: 80,
        isPredator: true,
        prey: ["シマウマ", "キリン", "トムソンガゼル"],
        dailyRoutine: {
            morning: ["低地草原", "森林"],
            afternoon: ["低地草原", "川"],
            evening: ["低地草原", "丘陵"],
            night: ["丘陵"]
        },
        home: null // 動的に生成
    },
    {
        name: "ナラ",
        type: "ライオン",
        age: 7,
        personality: {
            description: "メスライオン。狩りの技術が高く、群れの食料確保を担当。冷静で賢い。",
            traits: {
                aggression: 0.8,
                energy: 0.7,
                sociability: 0.6,
                intelligence: 0.9,
                leadership: 0.5
            }
        },
        color: 0xD2691E, // 明るい茶色（ライオン）
        hp: 90,
        maxHp: 90,
        isPredator: true,
        prey: ["シマウマ", "キリン", "トムソンガゼル"],
        dailyRoutine: {
            morning: ["低地草原", "森林"],
            afternoon: ["低地草原", "川"],
            evening: ["低地草原", "丘陵"],
            night: ["丘陵"]
        },
        home: null // 動的に生成
    },
    {
        name: "マフサ",
        type: "ライオン",
        age: 5,
        personality: {
            description: "若いメスライオン。狩りの技術を学んでいる最中で、ナラの弟子。",
            traits: {
                aggression: 0.7,
                energy: 0.8,
                sociability: 0.7,
                intelligence: 0.8,
                leadership: 0.4
            }
        },
        color: 0xD2691E, // 明るい茶色（ライオン）
        hp: 75,
        maxHp: 75,
        isPredator: true,
        prey: ["シマウマ", "キリン", "トムソンガゼル"],
        dailyRoutine: {
            morning: ["低地草原", "森林"],
            afternoon: ["低地草原", "川"],
            evening: ["低地草原", "丘陵"],
            night: ["丘陵"]
        },
        home: null // 動的に生成
    },
    {
        name: "スカー",
        type: "ライオン",
        age: 9,
        personality: {
            description: "経験豊富なライオン。顔に傷があり、多くの戦いを経験してきた。",
            traits: {
                aggression: 0.9,
                energy: 0.6,
                sociability: 0.5,
                intelligence: 0.9,
                leadership: 0.8
            }
        },
        color: 0xD2691E, // 明るい茶色（ライオン）
        hp: 95,
        maxHp: 95,
        isPredator: true,
        prey: ["シマウマ", "キリン", "トムソンガゼル"],
        dailyRoutine: {
            morning: ["低地草原", "森林"],
            afternoon: ["低地草原", "川"],
            evening: ["低地草原", "丘陵"],
            night: ["丘陵"]
        },
        home: null // 動的に生成
    },
    {
        name: "キアラ",
        type: "ライオン",
        age: 4,
        personality: {
            description: "最も若いライオン。遊び好きで、群れを楽しませるのが得意。",
            traits: {
                aggression: 0.6,
                energy: 0.9,
                sociability: 0.9,
                intelligence: 0.6,
                leadership: 0.3
            }
        },
        color: 0xD2691E, // 明るい茶色（ライオン）
        hp: 70,
        maxHp: 70,
        isPredator: true,
        prey: ["シマウマ", "キリン", "トムソンガゼル"],
        dailyRoutine: {
            morning: ["低地草原", "森林"],
            afternoon: ["低地草原", "川"],
            evening: ["低地草原", "丘陵"],
            night: ["丘陵"]
        },
        home: null // 動的に生成
    },

    // ゾウ（6匹 - 2倍に増加）
    {
        name: "ダンボ",
        type: "ゾウ",
        age: 25,
        personality: {
            description: "群れの長老。経験豊富で、他の動物たちから尊敬されている。穏やかで賢い。",
            traits: {
                aggression: 0.2,
                energy: 0.5,
                sociability: 0.9,
                intelligence: 0.9,
                leadership: 0.8
            }
        },
        color: 0xA9A9A9, // 明るい灰色（ゾウ）
        hp: 200,
        maxHp: 200,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "川"],
            afternoon: ["森林", "低地草原"],
            evening: ["川", "低地草原"],
            night: ["低地草原"]
        },
        home: null // 動的に生成
    },
    {
        name: "エリー",
        type: "ゾウ",
        age: 20,
        personality: {
            description: "メスゾウ。子育ての経験が豊富で、群れの母親的存在。優しくて保護的。",
            traits: {
                aggression: 0.1,
                energy: 0.6,
                sociability: 0.95,
                intelligence: 0.8,
                leadership: 0.7
            }
        },
        color: 0xA9A9A9, // 明るい灰色（ゾウ）
        hp: 180,
        maxHp: 180,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "川"],
            afternoon: ["森林", "低地草原"],
            evening: ["川", "低地草原"],
            night: ["低地草原"]
        },
        home: null // 動的に生成
    },
    {
        name: "トゥスク",
        type: "ゾウ",
        age: 15,
        personality: {
            description: "若いオスゾウ。好奇心旺盛で、新しい場所を探検するのが好き。",
            traits: {
                aggression: 0.3,
                energy: 0.8,
                sociability: 0.7,
                intelligence: 0.7,
                leadership: 0.4
            }
        },
        color: 0xA9A9A9, // 明るい灰色（ゾウ）
        hp: 160,
        maxHp: 160,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "川"],
            afternoon: ["森林", "低地草原"],
            evening: ["川", "低地草原"],
            night: ["低地草原"]
        },
        home: null // 動的に生成
    },
    {
        name: "マティルダ",
        type: "ゾウ",
        age: 18,
        personality: {
            description: "メスゾウ。芸術的な性格で、木の枝で絵を描くのが好き。",
            traits: {
                aggression: 0.1,
                energy: 0.7,
                sociability: 0.8,
                intelligence: 0.9,
                leadership: 0.5
            }
        },
        color: 0xA9A9A9, // 明るい灰色（ゾウ）
        hp: 170,
        maxHp: 170,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "川"],
            afternoon: ["森林", "低地草原"],
            evening: ["川", "低地草原"],
            night: ["低地草原"]
        },
        home: null // 動的に生成
    },
    {
        name: "バルー",
        type: "ゾウ",
        age: 12,
        personality: {
            description: "若いオスゾウ。音楽が好きで、鼻でリズムを取るのが得意。",
            traits: {
                aggression: 0.2,
                energy: 0.9,
                sociability: 0.8,
                intelligence: 0.6,
                leadership: 0.3
            }
        },
        color: 0xA9A9A9, // 明るい灰色（ゾウ）
        hp: 140,
        maxHp: 140,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "川"],
            afternoon: ["森林", "低地草原"],
            evening: ["川", "低地草原"],
            night: ["低地草原"]
        },
        home: null // 動的に生成
    },
    {
        name: "ポー",
        type: "ゾウ",
        age: 22,
        personality: {
            description: "メスゾウ。哲学的な性格で、深い思考を好む。群れの知恵袋的存在。",
            traits: {
                aggression: 0.1,
                energy: 0.4,
                sociability: 0.7,
                intelligence: 0.95,
                leadership: 0.6
            }
        },
        color: 0xA9A9A9, // 明るい灰色（ゾウ）
        hp: 190,
        maxHp: 190,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "川"],
            afternoon: ["森林", "低地草原"],
            evening: ["川", "低地草原"],
            night: ["低地草原"]
        },
        home: null // 動的に生成
    },

    // キリン（6匹 - 2倍に増加）
    {
        name: "ジラフ",
        type: "キリン",
        age: 12,
        personality: {
            description: "群れのリーダー。高い視点から周囲を監視し、危険を察知する能力が高い。",
            traits: {
                aggression: 0.1,
                energy: 0.7,
                sociability: 0.6,
                intelligence: 0.8,
                leadership: 0.8
            }
        },
        color: 0xFFD700, // 黄色（キリン）
        hp: 120,
        maxHp: 120,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["森林", "低地草原"],
            afternoon: ["低地草原", "川"],
            evening: ["森林", "低地草原"],
            night: ["森林"]
        },
        home: null // 動的に生成
    },
    {
        name: "ネッカ",
        type: "キリン",
        age: 8,
        personality: {
            description: "若いキリン。長い首を活かして高い木の葉を食べるのが得意。",
            traits: {
                aggression: 0.2,
                energy: 0.8,
                sociability: 0.7,
                intelligence: 0.6,
                leadership: 0.3
            }
        },
        color: 0xFFD700, // 黄色（キリン）
        hp: 100,
        maxHp: 100,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["森林", "低地草原"],
            afternoon: ["低地草原", "川"],
            evening: ["森林", "低地草原"],
            night: ["森林"]
        },
        home: null // 動的に生成
    },
    {
        name: "スポット",
        type: "キリン",
        age: 10,
        personality: {
            description: "メスキリン。模様が美しく、群れの中で最も目立つ存在。",
            traits: {
                aggression: 0.1,
                energy: 0.6,
                sociability: 0.8,
                intelligence: 0.7,
                leadership: 0.5
            }
        },
        color: 0xFFD700, // 黄色（キリン）
        hp: 110,
        maxHp: 110,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["森林", "低地草原"],
            afternoon: ["低地草原", "川"],
            evening: ["森林", "低地草原"],
            night: ["森林"]
        },
        home: null // 動的に生成
    },
    {
        name: "ハイツ",
        type: "キリン",
        age: 6,
        personality: {
            description: "最も若いキリン。長い首を活かして遠くまで見渡すのが得意。",
            traits: {
                aggression: 0.1,
                energy: 0.9,
                sociability: 0.8,
                intelligence: 0.5,
                leadership: 0.2
            }
        },
        color: 0xFFD700, // 黄色（キリン）
        hp: 90,
        maxHp: 90,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["森林", "低地草原"],
            afternoon: ["低地草原", "川"],
            evening: ["森林", "低地草原"],
            night: ["森林"]
        },
        home: null // 動的に生成
    },
    {
        name: "スカイ",
        type: "キリン",
        age: 14,
        personality: {
            description: "年長のキリン。空を見上げるのが好きで、天気を予測するのが得意。",
            traits: {
                aggression: 0.1,
                energy: 0.5,
                sociability: 0.7,
                intelligence: 0.9,
                leadership: 0.6
            }
        },
        color: 0xFFD700, // 黄色（キリン）
        hp: 130,
        maxHp: 130,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["森林", "低地草原"],
            afternoon: ["低地草原", "川"],
            evening: ["森林", "低地草原"],
            night: ["森林"]
        },
        home: null // 動的に生成
    },
    {
        name: "ブレイズ",
        type: "キリン",
        age: 9,
        personality: {
            description: "メスキリン。模様が炎のように見えることから名付けられた。",
            traits: {
                aggression: 0.2,
                energy: 0.7,
                sociability: 0.8,
                intelligence: 0.7,
                leadership: 0.4
            }
        },
        color: 0xFFD700, // 黄色（キリン）
        hp: 105,
        maxHp: 105,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["森林", "低地草原"],
            afternoon: ["低地草原", "川"],
            evening: ["森林", "低地草原"],
            night: ["森林"]
        },
        home: null // 動的に生成
    },

    // シマウマ（6匹 - 2倍に増加）
    {
        name: "ゼブラ",
        type: "シマウマ",
        age: 6,
        personality: {
            description: "群れのリーダー。模様が特徴的で、危険を察知する能力が高い。",
            traits: {
                aggression: 0.3,
                energy: 0.9,
                sociability: 0.8,
                intelligence: 0.7,
                leadership: 0.8
            }
        },
        color: 0xFFFFFF, // 白（シマウマ）
        hp: 80,
        maxHp: 80,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "川"],
            afternoon: ["低地草原", "森林"],
            evening: ["低地草原", "川"],
            night: ["低地草原"]
        },
        home: null // 動的に生成
    },
    {
        name: "ストライプ",
        type: "シマウマ",
        age: 4,
        personality: {
            description: "若いシマウマ。走るのが大好きで、群れの中で最も活発。",
            traits: {
                aggression: 0.2,
                energy: 0.95,
                sociability: 0.9,
                intelligence: 0.5,
                leadership: 0.3
            }
        },
        color: 0xFFFFFF, // 白（シマウマ）
        hp: 70,
        maxHp: 70,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "川"],
            afternoon: ["低地草原", "森林"],
            evening: ["低地草原", "川"],
            night: ["低地草原"]
        },
        home: null // 動的に生成
    },
    {
        name: "マラ",
        type: "シマウマ",
        age: 5,
        personality: {
            description: "メスシマウマ。群れの母親的存在で、他のシマウマを守る。",
            traits: {
                aggression: 0.4,
                energy: 0.8,
                sociability: 0.9,
                intelligence: 0.8,
                leadership: 0.6
            }
        },
        color: 0xFFFFFF, // 白（シマウマ）
        hp: 75,
        maxHp: 75,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "川"],
            afternoon: ["低地草原", "森林"],
            evening: ["低地草原", "川"],
            night: ["低地草原"]
        },
        home: null // 動的に生成
    },
    {
        name: "ダッシュ",
        type: "シマウマ",
        age: 3,
        personality: {
            description: "最も若いシマウマ。走るのが大好きで、群れの中で最も速い。",
            traits: {
                aggression: 0.1,
                energy: 0.95,
                sociability: 0.9,
                intelligence: 0.4,
                leadership: 0.1
            }
        },
        color: 0xFFFFFF, // 白（シマウマ）
        hp: 65,
        maxHp: 65,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "川"],
            afternoon: ["低地草原", "森林"],
            evening: ["低地草原", "川"],
            night: ["低地草原"]
        },
        home: null // 動的に生成
    },
    {
        name: "シャドウ",
        type: "シマウマ",
        age: 7,
        personality: {
            description: "年長のシマウマ。経験豊富で、群れの知恵袋的存在。",
            traits: {
                aggression: 0.3,
                energy: 0.7,
                sociability: 0.8,
                intelligence: 0.9,
                leadership: 0.7
            }
        },
        color: 0xFFFFFF, // 白（シマウマ）
        hp: 85,
        maxHp: 85,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "川"],
            afternoon: ["低地草原", "森林"],
            evening: ["低地草原", "川"],
            night: ["低地草原"]
        },
        home: null // 動的に生成
    },
    {
        name: "スパーク",
        type: "シマウマ",
        age: 4,
        personality: {
            description: "メスシマウマ。模様が光るように見えることから名付けられた。",
            traits: {
                aggression: 0.3,
                energy: 0.8,
                sociability: 0.8,
                intelligence: 0.6,
                leadership: 0.4
            }
        },
        color: 0xFFFFFF, // 白（シマウマ）
        hp: 70,
        maxHp: 70,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "川"],
            afternoon: ["低地草原", "森林"],
            evening: ["低地草原", "川"],
            night: ["低地草原"]
        },
        home: null // 動的に生成
    },

    // ハイエナ（6匹 - 2倍に増加）
    {
        name: "スカーフ",
        type: "ハイエナ",
        age: 7,
        personality: {
            description: "群れのリーダー。狡猾で知能が高く、他の動物の獲物を横取りするのが得意。",
            traits: {
                aggression: 0.8,
                energy: 0.7,
                sociability: 0.8,
                intelligence: 0.9,
                leadership: 0.8
            }
        },
        color: 0x808080, // グレー（ハイエナ）
        hp: 60,
        maxHp: 60,
        isPredator: true,
        prey: ["シマウマ", "トムソンガゼル"],
        dailyRoutine: {
            morning: ["低地草原", "山地"],
            afternoon: ["低地草原", "丘陵"],
            evening: ["低地草原", "山地"],
            night: ["丘陵"]
        },
        home: null // 動的に生成
    },
    {
        name: "バンジ",
        type: "ハイエナ",
        age: 5,
        personality: {
            description: "若いハイエナ。群れの中で最も活発で、狩りの技術を学んでいる。",
            traits: {
                aggression: 0.7,
                energy: 0.9,
                sociability: 0.7,
                intelligence: 0.6,
                leadership: 0.3
            }
        },
        color: 0x808080, // グレー（ハイエナ）
        hp: 50,
        maxHp: 50,
        isPredator: true,
        prey: ["シマウマ", "トムソンガゼル"],
        dailyRoutine: {
            morning: ["低地草原", "山地"],
            afternoon: ["低地草原", "丘陵"],
            evening: ["低地草原", "山地"],
            night: ["丘陵"]
        },
        home: null // 動的に生成
    },
    {
        name: "シェナ",
        type: "ハイエナ",
        age: 6,
        personality: {
            description: "メスハイエナ。群れの母親的存在で、他のハイエナを守る。",
            traits: {
                aggression: 0.6,
                energy: 0.8,
                sociability: 0.9,
                intelligence: 0.8,
                leadership: 0.7
            }
        },
        color: 0x808080, // グレー（ハイエナ）
        hp: 55,
        maxHp: 55,
        isPredator: true,
        prey: ["シマウマ", "トムソンガゼル"],
        dailyRoutine: {
            morning: ["低地草原", "山地"],
            afternoon: ["低地草原", "丘陵"],
            evening: ["低地草原", "山地"],
            night: ["丘陵"]
        },
        home: null // 動的に生成
    },
    {
        name: "ラッシュ",
        type: "ハイエナ",
        age: 4,
        personality: {
            description: "若いハイエナ。好奇心旺盛で、新しい狩りの方法を試すのが好き。",
            traits: {
                aggression: 0.6,
                energy: 0.9,
                sociability: 0.6,
                intelligence: 0.7,
                leadership: 0.2
            }
        },
        color: 0x808080, // グレー（ハイエナ）
        hp: 45,
        maxHp: 45,
        isPredator: true,
        prey: ["シマウマ", "トムソンガゼル"],
        dailyRoutine: {
            morning: ["低地草原", "山地"],
            afternoon: ["低地草原", "丘陵"],
            evening: ["低地草原", "山地"],
            night: ["丘陵"]
        },
        home: null // 動的に生成
    },
    {
        name: "シャドウ",
        type: "ハイエナ",
        age: 8,
        personality: {
            description: "経験豊富なハイエナ。夜の狩りが得意で、影のように静かに獲物に近づく。",
            traits: {
                aggression: 0.8,
                energy: 0.6,
                sociability: 0.7,
                intelligence: 0.9,
                leadership: 0.6
            }
        },
        color: 0x808080, // グレー（ハイエナ）
        hp: 65,
        maxHp: 65,
        isPredator: true,
        prey: ["シマウマ", "トムソンガゼル"],
        dailyRoutine: {
            morning: ["低地草原", "山地"],
            afternoon: ["低地草原", "丘陵"],
            evening: ["低地草原", "山地"],
            night: ["丘陵"]
        },
        home: null // 動的に生成
    },
    {
        name: "ウィスパー",
        type: "ハイエナ",
        age: 5,
        personality: {
            description: "メスハイエナ。声が小さく、静かに行動する。群れの偵察役を担当。",
            traits: {
                aggression: 0.5,
                energy: 0.7,
                sociability: 0.8,
                intelligence: 0.8,
                leadership: 0.4
            }
        },
        color: 0x808080, // グレー（ハイエナ）
        hp: 50,
        maxHp: 50,
        isPredator: true,
        prey: ["シマウマ", "トムソンガゼル"],
        dailyRoutine: {
            morning: ["低地草原", "山地"],
            afternoon: ["低地草原", "丘陵"],
            evening: ["低地草原", "山地"],
            night: ["丘陵"]
        },
        home: null // 動的に生成
    },

    // ミーアキャット（6匹 - 新規追加）
    {
        name: "ティモン",
        type: "ミーアキャット",
        age: 3,
        personality: {
            description: "群れのリーダー。立ち上がって周囲を見張るのが得意。家族思いで責任感が強い。",
            traits: {
                aggression: 0.3,
                energy: 0.9,
                sociability: 0.95,
                intelligence: 0.8,
                leadership: 0.9
            }
        },
        color: 0xD2B48C, // ベージュ（ミーアキャット）
        hp: 30,
        maxHp: 30,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "丘陵"],
            afternoon: ["低地草原", "山地"],
            evening: ["低地草原", "丘陵"],
            night: ["山地"]
        },
        home: null // 動的に生成
    },
    {
        name: "プンバ",
        type: "ミーアキャット",
        age: 2,
        personality: {
            description: "若いミーアキャット。好奇心旺盛で、新しいことを学ぶのが大好き。",
            traits: {
                aggression: 0.2,
                energy: 0.95,
                sociability: 0.9,
                intelligence: 0.7,
                leadership: 0.3
            }
        },
        color: 0xD2B48C, // ベージュ（ミーアキャット）
        hp: 25,
        maxHp: 25,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "丘陵"],
            afternoon: ["低地草原", "山地"],
            evening: ["低地草原", "丘陵"],
            night: ["山地"]
        },
        home: null // 動的に生成
    },
    {
        name: "サラ",
        type: "ミーアキャット",
        age: 4,
        personality: {
            description: "メスミーアキャット。子育ての経験が豊富で、群れの母親的存在。",
            traits: {
                aggression: 0.4,
                energy: 0.8,
                sociability: 0.95,
                intelligence: 0.8,
                leadership: 0.7
            }
        },
        color: 0xD2B48C, // ベージュ（ミーアキャット）
        hp: 35,
        maxHp: 35,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "丘陵"],
            afternoon: ["低地草原", "山地"],
            evening: ["低地草原", "丘陵"],
            night: ["山地"]
        },
        home: null // 動的に生成
    },
    {
        name: "スカウト",
        type: "ミーアキャット",
        age: 2,
        personality: {
            description: "見張り役のミーアキャット。高い視点から危険を察知するのが得意。",
            traits: {
                aggression: 0.3,
                energy: 0.8,
                sociability: 0.8,
                intelligence: 0.9,
                leadership: 0.5
            }
        },
        color: 0xD2B48C, // ベージュ（ミーアキャット）
        hp: 25,
        maxHp: 25,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "丘陵"],
            afternoon: ["低地草原", "山地"],
            evening: ["低地草原", "丘陵"],
            night: ["山地"]
        },
        home: null // 動的に生成
    },
    {
        name: "ダッシュ",
        type: "ミーアキャット",
        age: 1,
        personality: {
            description: "最も若いミーアキャット。走るのが大好きで、群れの中で最も活発。",
            traits: {
                aggression: 0.1,
                energy: 0.95,
                sociability: 0.9,
                intelligence: 0.5,
                leadership: 0.1
            }
        },
        color: 0xD2B48C, // ベージュ（ミーアキャット）
        hp: 20,
        maxHp: 20,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "丘陵"],
            afternoon: ["低地草原", "山地"],
            evening: ["低地草原", "丘陵"],
            night: ["山地"]
        },
        home: null // 動的に生成
    },
    {
        name: "ウィンク",
        type: "ミーアキャット",
        age: 3,
        personality: {
            description: "遊び好きなミーアキャット。群れを笑わせるのが得意で、みんなの人気者。",
            traits: {
                aggression: 0.2,
                energy: 0.9,
                sociability: 0.95,
                intelligence: 0.6,
                leadership: 0.4
            }
        },
        color: 0xD2B48C, // ベージュ（ミーアキャット）
        hp: 30,
        maxHp: 30,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "丘陵"],
            afternoon: ["低地草原", "山地"],
            evening: ["低地草原", "丘陵"],
            night: ["山地"]
        },
        home: null // 動的に生成
    },

    // トムソンガゼル（6匹 - 新規追加）
    {
        name: "トミー",
        type: "トムソンガゼル",
        age: 4,
        personality: {
            description: "群れのリーダー。素早く走るのが得意で、危険を察知する能力が高い。",
            traits: {
                aggression: 0.2,
                energy: 0.95,
                sociability: 0.8,
                intelligence: 0.7,
                leadership: 0.8
            }
        },
        color: 0xF4A460, // サンディーブラウン（トムソンガゼル）
        hp: 40,
        maxHp: 40,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "川"],
            afternoon: ["低地草原", "森林"],
            evening: ["低地草原", "川"],
            night: ["低地草原"]
        },
        home: null // 動的に生成
    },
    {
        name: "スプリント",
        type: "トムソンガゼル",
        age: 2,
        personality: {
            description: "若いガゼル。走るのが大好きで、群れの中で最も速い。",
            traits: {
                aggression: 0.1,
                energy: 0.95,
                sociability: 0.9,
                intelligence: 0.5,
                leadership: 0.3
            }
        },
        color: 0xF4A460, // サンディーブラウン（トムソンガゼル）
        hp: 35,
        maxHp: 35,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "川"],
            afternoon: ["低地草原", "森林"],
            evening: ["低地草原", "川"],
            night: ["低地草原"]
        },
        home: null // 動的に生成
    },
    {
        name: "グレース",
        type: "トムソンガゼル",
        age: 5,
        personality: {
            description: "メスガゼル。優雅な動きで知られ、群れの母親的存在。",
            traits: {
                aggression: 0.3,
                energy: 0.8,
                sociability: 0.9,
                intelligence: 0.8,
                leadership: 0.6
            }
        },
        color: 0xF4A460, // サンディーブラウン（トムソンガゼル）
        hp: 45,
        maxHp: 45,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "川"],
            afternoon: ["低地草原", "森林"],
            evening: ["低地草原", "川"],
            night: ["低地草原"]
        },
        home: null // 動的に生成
    },
    {
        name: "ホップ",
        type: "トムソンガゼル",
        age: 1,
        personality: {
            description: "最も若いガゼル。跳ねるように走るのが特徴で、みんなを楽しませる。",
            traits: {
                aggression: 0.1,
                energy: 0.95,
                sociability: 0.9,
                intelligence: 0.4,
                leadership: 0.1
            }
        },
        color: 0xF4A460, // サンディーブラウン（トムソンガゼル）
        hp: 30,
        maxHp: 30,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "川"],
            afternoon: ["低地草原", "森林"],
            evening: ["低地草原", "川"],
            night: ["低地草原"]
        },
        home: null // 動的に生成
    },
    {
        name: "ウィンド",
        type: "トムソンガゼル",
        age: 3,
        personality: {
            description: "風のように速いガゼル。長距離を走るのが得意で、群れの先導役。",
            traits: {
                aggression: 0.2,
                energy: 0.9,
                sociability: 0.7,
                intelligence: 0.6,
                leadership: 0.5
            }
        },
        color: 0xF4A460, // サンディーブラウン（トムソンガゼル）
        hp: 40,
        maxHp: 40,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "川"],
            afternoon: ["低地草原", "森林"],
            evening: ["低地草原", "川"],
            night: ["低地草原"]
        },
        home: null // 動的に生成
    },
    {
        name: "スター",
        type: "トムソンガゼル",
        age: 4,
        personality: {
            description: "美しいガゼル。模様が特徴的で、群れの中で最も目立つ存在。",
            traits: {
                aggression: 0.2,
                energy: 0.8,
                sociability: 0.8,
                intelligence: 0.7,
                leadership: 0.4
            }
        },
        color: 0xF4A460, // サンディーブラウン（トムソンガゼル）
        hp: 40,
        maxHp: 40,
        isPredator: false,
        prey: [],
        dailyRoutine: {
            morning: ["低地草原", "川"],
            afternoon: ["低地草原", "森林"],
            evening: ["低地草原", "川"],
            night: ["低地草原"]
        },
        home: null // 動的に生成
    }
];

// 動物の種類別の基本情報
const animalTypes = {
    "ライオン": {
        speed: 0.8,
        attackPower: 90,
        defense: 70,
        size: 1.2,
        description: "百獣の王。強力な狩人で、群れで協力して狩りを行う。",
        preferredTerrain: ["低地草原", "丘陵"], // 得意な地形
        homeTerrain: "丘陵" // ねぐらの地形
    },
    "ゾウ": {
        speed: 0.4,
        attackPower: 60,
        defense: 95,
        size: 2.0,
        description: "陸上最大の動物。知能が高く、群れで行動する。",
        preferredTerrain: ["低地草原", "森林", "川"], // 川を追加
        homeTerrain: "低地草原"
    },
    "キリン": {
        speed: 0.6,
        attackPower: 30,
        defense: 50,
        size: 1.8,
        description: "首が長く、高い木の葉を食べる。視界が広く、危険を察知する能力が高い。",
        preferredTerrain: ["低地草原", "森林"],
        homeTerrain: "低地草原"
    },
    "シマウマ": {
        speed: 0.9,
        attackPower: 20,
        defense: 40,
        size: 1.0,
        description: "模様が特徴的で、群れで行動する。走るのが得意。",
        preferredTerrain: ["低地草原", "川"], // 川を追加
        homeTerrain: "低地草原"
    },
    "ハイエナ": {
        speed: 0.7,
        attackPower: 50,
        defense: 45,
        size: 0.8,
        description: "狡猾で知能が高い。他の動物の獲物を横取りすることもある。",
        preferredTerrain: ["丘陵", "低地草原"],
        homeTerrain: "丘陵"
    },
    "ミーアキャット": {
        speed: 0.8,
        attackPower: 15,
        defense: 30,
        size: 0.4,
        description: "小さくて社交的な動物。立ち上がって周囲を見張るのが特徴。",
        preferredTerrain: ["低地草原", "丘陵", "山地"],
        homeTerrain: "山地"
    },
    "トムソンガゼル": {
        speed: 1.0,
        attackPower: 10,
        defense: 35,
        size: 0.6,
        description: "素早く走るのが得意な小型のガゼル。群れで行動する。",
        preferredTerrain: ["低地草原", "川"],
        homeTerrain: "低地草原"
    }
};

// 地形の情報
const terrainInfo = {
    "草原": {
        color: 0x90EE90,
        activities: ["草を食べる", "休息", "遊ぶ", "群れで行動"],
        atmosphere: "開放的な空間で、多くの動物が集まる場所"
    },
    "木": {
        color: 0x228B22,
        activities: ["木の葉を食べる", "日陰で休息", "登る", "見張り"],
        atmosphere: "涼しい日陰があり、食べ物も豊富"
    },
    "池": {
        color: 0x4169E1,
        activities: ["水を飲む", "水浴び", "休息", "狩りの待ち伏せ"],
        atmosphere: "命の源となる水場、多くの動物が集まる"
    },
    "洞穴": {
        color: 0x2F4F4F,
        activities: ["休息", "睡眠", "子育て", "隠れる"],
        atmosphere: "安全な避難場所、夜の休息地"
    },
    "倒木": {
        color: 0x8B4513,
        activities: ["隠れる", "休息", "狩りの待ち伏せ", "遊ぶ"],
        atmosphere: "自然の障害物、隠れ場所として利用"
    },
    "大きな石": {
        color: 0x708090,
        activities: ["見張り", "休息", "日向ぼっこ", "隠れる"],
        atmosphere: "高い視点が得られ、周囲を見渡せる場所"
    }
};

// 地形のサイズ設定
const terrainSizes = {
    "草原": 8,
    "木": 3,
    "池": 4,
    "洞穴": 2,
    "倒木": 3,
    "大きな石": 2
};

// 時間帯別の活動パターン
const timeActivities = {
    morning: {
        description: "朝の活動時間",
        activities: ["食事", "水を飲む", "移動", "狩り"]
    },
    afternoon: {
        description: "昼の活動時間",
        activities: ["休息", "日陰で過ごす", "水浴び", "遊ぶ"]
    },
    evening: {
        description: "夕方の活動時間",
        activities: ["狩り", "食事", "移動", "群れでの活動"]
    },
    night: {
        description: "夜の休息時間",
        activities: ["睡眠", "休息", "見張り", "隠れる"]
    }
};

// 地形設定
const terrainConfig = {
    // 地形の高さ範囲と割合
    heightRanges: {
        "川": { min: -3, max: 0, ratio: 0.1 },        // 川 - 新規追加
        "低地草原": { min: 0, max: 3, ratio: 0.25 },   // 低地草原 - 割合調整
        "森林": { min: 3, max: 8, ratio: 0.25 },       // 25% - 増加
        "丘陵": { min: 8, max: 15, ratio: 0.2 },      // 20% - 増加
        "山地": { min: 15, max: 25, ratio: 0.1 },     // 15% - 減少
        "高山": { min: 25, max: 50, ratio: 0.1 }      // 5% - 大幅減少
    },
    
    // 地形の色設定
    colors: {
        "川": { r: 0.2, g: 0.6, b: 0.9 },      // 川 - 水色
        "低地草原": { r: 0.4, g: 0.8, b: 0.2 },
        "森林": { r: 0.2, g: 0.6, b: 0.1 },
        "丘陵": { r: 0.6, g: 0.5, b: 0.3 },
        "山地": { r: 0.5, g: 0.5, b: 0.5 },
        "高山": { r: 0.9, g: 0.9, b: 0.9 }
    },
    
    // 地形生成パラメータ
    generation: {
        baseNoiseScale: 0.3,
        detailNoiseScale: 1.0,
        mountainNoiseScale: 0.2,
        baseNoiseAmplitude: 8,      // 10から8に減少
        detailNoiseAmplitude: 2,    // 3から2に減少
        mountainNoiseAmplitude: 3,  // 5から3に減少
        continentShapeScale: 0.0003 // 0.0005から0.0003に減少
    }
};

// 動物の初期位置を得意な地形に配置する関数
function findSuitableHomeLocation(animalType, index) {
    const animalInfo = animalTypes[animalType];
    const preferredTerrain = animalInfo.homeTerrain;
    const terrainRange = terrainConfig.heightRanges[preferredTerrain];
    
    // 既存のねぐら位置を取得（グローバル変数から）
    const existingHomes = [];
    if (typeof animalPersonalities !== 'undefined') {
        animalPersonalities.forEach((animal, i) => {
            if (i < index && animal.home) {
                existingHomes.push({ 
                    x: animal.home.x, 
                    z: animal.home.z, 
                    type: animal.type 
                });
            }
        });
    }
    
    // 動物の種類に応じた距離設定
    const sameTypeMinDistance = 15; // 同じ種類の動物は近くに配置
    const differentTypeMinDistance = 50; // 異なる種類の動物は離れて配置
    const maxAttempts = 200; // 試行回数を増やす
    
    let attempts = 0; // attempts変数の宣言を追加
    
    while (attempts < maxAttempts) {
        // サバンナの範囲内でランダムな位置を生成（より広い範囲で分散）
        const x = (Math.random() - 0.5) * 300; // -150 から 150
        const z = (Math.random() - 0.5) * 300; // -150 から 150
        
        // 地形の高さを取得（関数が利用できない場合は0を返す）
        let height = 0;
        try {
            if (typeof getTerrainHeight === 'function') {
                height = getTerrainHeight(x, z);
            } else {
                // getTerrainHeight関数が利用できない場合は、地形範囲の中央値を使用
                height = (terrainRange.min + terrainRange.max) / 2;
            }
        } catch (error) {
            // エラーが発生した場合は、地形範囲の中央値を使用
            height = (terrainRange.min + terrainRange.max) / 2;
        }
        
        // 実際の地形タイプを判定
        let actualTerrainType = preferredTerrain;
        for (const [terrainName, range] of Object.entries(terrainConfig.heightRanges)) {
            if (height >= range.min && height < range.max) {
                actualTerrainType = terrainName;
                break;
            }
        }
        
        // 川の中は避ける
        if (actualTerrainType === "川") {
            attempts++;
            continue;
        }
        
        // 得意な地形の範囲内かチェック
        if (height >= terrainRange.min && height < terrainRange.max) {
                    // 既存のねぐらとの距離をチェック（種類に応じて）
        let tooClose = false;
        for (const existingHome of existingHomes) {
            const distance = Math.sqrt(
                Math.pow(x - existingHome.x, 2) + 
                Math.pow(z - existingHome.z, 2)
            );
            
            // 同じ種類の動物は近くに、異なる種類は離れて配置
            const minDistance = (existingHome.type === animalType) ? 
                sameTypeMinDistance : differentTypeMinDistance;
            
            if (distance < minDistance) {
                tooClose = true;
                break;
            }
        }
            
            // 十分な距離がある場合は位置を返す
            if (!tooClose) {
                return {
                    x: x,
                    z: z,
                    terrainType: actualTerrainType, // 実際の地形タイプを返す
                    height: height
                };
            }
        }
        
        attempts++;
    }
    
    // 適切な位置が見つからない場合は、デフォルトの位置を返す（距離を離して配置）
    const defaultPositions = [
        { x: -80, z: -80 },   // 北西
        { x: 80, z: -80 },    // 北東
        { x: -80, z: 80 },    // 南西
        { x: 80, z: 80 },     // 南東
        { x: 0, z: -90 },     // 北中央
        { x: 0, z: 90 },      // 南中央
        { x: -90, z: 0 },     // 西中央
        { x: 90, z: 0 },      // 東中央
        { x: -60, z: -60 },   // 北西（内側）
        { x: 60, z: -60 },    // 北東（内側）
        { x: -60, z: 60 },    // 南西（内側）
        { x: 60, z: 60 },     // 南東（内側）
        { x: -40, z: 0 },     // 西（内側）
        { x: 40, z: 0 },      // 東（内側）
        { x: 0, z: -40 }      // 北（内側）
    ];
    
    const defaultPos = defaultPositions[index % defaultPositions.length];
    let defaultHeight = 0;
    try {
        if (typeof getTerrainHeight === 'function') {
            defaultHeight = getTerrainHeight(defaultPos.x, defaultPos.z);
        } else {
            defaultHeight = (terrainRange.min + terrainRange.max) / 2;
        }
    } catch (error) {
        defaultHeight = (terrainRange.min + terrainRange.max) / 2;
    }
    
    // デフォルト位置の実際の地形タイプを判定
    let actualTerrainType = preferredTerrain;
    for (const [terrainName, range] of Object.entries(terrainConfig.heightRanges)) {
        if (defaultHeight >= range.min && defaultHeight < range.max) {
            actualTerrainType = terrainName;
            break;
        }
    }
    
    // デフォルト位置が川の場合は、適切な地形に調整
    if (actualTerrainType === "川") {
        // 川から少し離れた位置に調整
        const adjustedX = defaultPos.x + (Math.random() - 0.5) * 20;
        const adjustedZ = defaultPos.z + (Math.random() - 0.5) * 20;
        let adjustedHeight = 0;
        try {
            if (typeof getTerrainHeight === 'function') {
                adjustedHeight = getTerrainHeight(adjustedX, adjustedZ);
            } else {
                adjustedHeight = (terrainRange.min + terrainRange.max) / 2;
            }
        } catch (error) {
            adjustedHeight = (terrainRange.min + terrainRange.max) / 2;
        }
        
        // 調整後の地形タイプを再判定
        for (const [terrainName, range] of Object.entries(terrainConfig.heightRanges)) {
            if (adjustedHeight >= range.min && adjustedHeight < range.max) {
                actualTerrainType = terrainName;
                break;
            }
        }
        
        return {
            x: adjustedX,
            z: adjustedZ,
            terrainType: actualTerrainType,
            height: adjustedHeight
        };
    }
    
    return {
        x: defaultPos.x,
        z: defaultPos.z,
        terrainType: actualTerrainType, // 実際の地形タイプを返す
        height: defaultHeight
    };
}