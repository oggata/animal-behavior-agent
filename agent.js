// 動物クラス（サバンナ版）
class Animal {
    constructor(data, index) {
        this.name = data.name;
        this.type = data.type;
        this.age = data.age;
        this.personality = data.personality;
        this.dailyRoutine = data.dailyRoutine;
        this.home = data.home;
        
        // homeオブジェクトが存在しない場合のデフォルト設定
        if (!this.home) {
            this.home = {
                name: `${this.name}の休息地`,
                x: 0,
                z: 0,
                color: data.color
            };
        }
        
        // currentLocationの安全な初期化
        this.currentLocation = locations.find(loc => loc.name === this.home.name);
        if (!this.currentLocation && locations.length > 0) {
            this.currentLocation = locations[0]; // 最初の地形をデフォルトに
        } else if (!this.currentLocation) {
            // locationsが空の場合のデフォルト設定
            this.currentLocation = {
                name: this.home.name,
                position: new THREE.Vector3(this.home.x, 0, this.home.z),
                type: 'grassland'
            };
        }
        this.targetLocation = this.currentLocation;
        
        // HPシステム
        this.hp = data.hp;
        this.maxHp = data.maxHp;
        this.isPredator = data.isPredator;
        this.prey = data.prey;
        this.isAlive = true;
        
        // 動物の種類別の基本情報
        const animalInfo = animalTypes[this.type];
        
        // config.jsの速度設定を使用して速度を計算
        const baseSpeed = simulationConfig.animalSpeed.baseSpeed;
        const speedMultiplier = simulationConfig.animalSpeed.speedMultiplier;
        const typeMultiplier = simulationConfig.animalSpeed.byType[this.type] || 1.0;
        
        this.speed = baseSpeed * speedMultiplier * typeMultiplier;
        this.attackPower = animalInfo.attackPower;
        this.defense = animalInfo.defense;
        this.size = animalInfo.size;
        
        // 記憶システム
        this.shortTermMemory = [];  // 短期記憶（最近の出来事）
        this.longTermMemory = [];   // 長期記憶（重要な出来事）
        this.relationships = new Map(); // 他の動物との関係性
        
        // 現在の状態
        this.currentThought = "サバンナで一日を始めています...";
        this.currentActivity = null;
        this.mood = "普通";
        this.energy = 1.0;
        this.hunger = 0.0; // 空腹度（0-1）
        this.thirst = 0.0; // 喉の渇き（0-1）
        this.isThinking = false;
        
        // 戦闘・狩り関連
        this.isHunting = false;
        this.huntingTarget = null;
        this.huntingStarted = false; // 実際に狩りを開始したかどうかのフラグ
        this.isBeingHunted = false;
        this.hunter = null;
        this.lastAttackTime = 0;
        this.attackCooldown = 3000; // 3秒
        
        // タイミング制御 - 初期値を短く設定してすぐに行動開始
        this.lastActionTime = Date.now();
        this.lastThoughtTime = Date.now() - 10000; // 10秒前に設定してすぐに思考開始
        this.thinkingDuration = 2000 + Math.random() * 3000; // 2-5秒に短縮
        
        // 3Dモデル
        this.createModel(data.color);
        
        // 移動関連
        this.movementTarget = null;
        this.lastMovingState = false; // 移動状態の変更を追跡するためのフラグ
        
        // 他の動物との関係を初期化
        this.initializeRelationships();
    }
    
    createModel(color) {
        // 既存の3Dモデルを削除（再生成時のため）
        if (this.characterInstance && this.characterInstance.dispose) {
            this.characterInstance.dispose();
        }
        // Characterクラスを使ってアバターを生成（gameはnullで渡す）
        this.characterInstance = new Character(scene, 'animal', null);
        // 位置を初期化
        if (this.currentLocation && this.currentLocation.position) {
            // 地形の高さを取得して初期位置を設定
            const terrainHeight = getTerrainHeight(
                this.currentLocation.position.x, 
                this.currentLocation.position.z
            );
            this.characterInstance.setPosition(
                this.currentLocation.position.x,
                terrainHeight + 1, // 地面から1ユニット上
                this.currentLocation.position.z
            );
        } else {
            // currentLocationがundefinedの場合のデフォルト位置
            const terrainHeight = getTerrainHeight(0, 0);
            this.characterInstance.setPosition(0, terrainHeight + 1, 0);
        }
        // 色を反映
        if (color) {
            this.characterInstance.setColor(color);
        }
        // 参照用
        this.mesh = this.characterInstance.character;
    }
    
    initializeRelationships() {
        // 既存の動物との関係を初期化
        agents.forEach(other => {
            if (other.name !== this.name) {
                // 捕食関係に基づいて初期関係を設定
                let initialAffinity = 0.5; // 中立的な関係から開始
                
                if (this.isPredator && this.prey.includes(other.type)) {
                    // 捕食者が獲物を見る場合
                    initialAffinity = 0.2; // 敵対的
                } else if (other.isPredator && other.prey.includes(this.type)) {
                    // 獲物が捕食者を見る場合
                    initialAffinity = 0.1; // 非常に敵対的
                } else if (this.type === other.type) {
                    // 同じ種類の動物
                    initialAffinity = 0.8; // 友好的
                }
                
                this.relationships.set(other.name, {
                    familiarity: Math.random() * 0.3, // 0-0.3の初期値
                    affinity: initialAffinity,
                    lastInteraction: null,
                    interactionCount: 0
                });

                // 相手側の関係も初期化
                if (!other.relationships.has(this.name)) {
                    other.relationships.set(this.name, {
                        familiarity: Math.random() * 0.3,
                        affinity: initialAffinity,
                        lastInteraction: null,
                        interactionCount: 0
                    });
                }
            }
        });
    }
    
    moveToLocation(location) {
        this.targetLocation = location;
        
        // 移動開始時に思考を一時停止
        this.lastThoughtTime = Date.now();
        
        // 地形の高さを取得して移動目標を設定
        const terrainHeight = getTerrainHeight(location.position.x, location.position.z);
        
        // 直接移動（サバンナでは道路がないため）
        this.movementTarget = new THREE.Vector3(
            location.position.x,
            terrainHeight + 1, // 地面から1ユニット上
            location.position.z
        );
        this.currentPath = null;

        // 移動方向を設定
        const direction = new THREE.Vector3()
            .subVectors(this.movementTarget, this.mesh.position)
            .normalize();
        this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
        
        // currentLocationがundefinedの場合の安全な処理
        const currentLocationName = this.currentLocation ? this.currentLocation.name : '不明';
        
        addLog(`🦁 ${this.name}が${location.name}へ移動開始`, 'move', `
                <div class="log-detail-section">
                    <h4>移動の詳細</h4>
                    <p>出発地: ${currentLocationName}</p>
                    <p>目的地: ${location.name}</p>
                    <p>移動速度: ${this.speed.toFixed(2)}</p>
                <p>動物タイプ: ${this.type}</p>
                </div>
            `);
    }
    
    update(deltaTime) {
        if (!this.isAlive) return;
        
        // 基本状態の更新
        this.updateBasicNeeds(deltaTime);
        
        // 移動の更新
        this.updateMovement(deltaTime);
        
        // 思考の更新
        this.updateThinking();
        
        // 狩り・戦闘の更新
        this.updateHunting(deltaTime);
        
        // 3Dモデルのアニメーション更新（Characterクラスにupdateメソッドがないため削除）
        // if (this.characterInstance) {
        //     this.characterInstance.update(deltaTime);
        // }
        
        // パネル情報の更新
        this.updatePanelInfo();
    }
    
    updateBasicNeeds(deltaTime) {
        // 時間経過で基本ニーズが増加（より早く増加するように調整）
        const timeScale = deltaTime / 1000; // 秒単位に変換
        
        // 空腹度と喉の渇きをより早く増加
        this.hunger = Math.min(1.0, this.hunger + 0.02 * timeScale);
        this.thirst = Math.min(1.0, this.thirst + 0.03 * timeScale);
        
        // エネルギーは徐々に減少
        this.energy = Math.max(0.0, this.energy - 0.01 * timeScale);
        
        // HPが低い場合は徐々に回復
        if (this.hp < this.maxHp && this.energy > 0.5) {
            this.hp = Math.min(this.maxHp, this.hp + 0.5 * timeScale);
        }
    }
    
    updateMovement(deltaTime) {
        // 狩り中は移動目標による移動を無効にする（updateHuntingで処理）
        if (this.isHunting && this.huntingTarget) {
            return;
        }
        
        if (this.movementTarget && this.isAlive) {
            const distance = this.mesh.position.distanceTo(this.movementTarget);
            
            if (distance > 0.5) {
                // 移動中
                const direction = new THREE.Vector3()
                    .subVectors(this.movementTarget, this.mesh.position)
                    .normalize();
                
                // 状況に応じた速度調整
                let situationMultiplier = simulationConfig.animalSpeed.bySituation.normal;
                if (this.isBeingHunted) {
                    situationMultiplier = simulationConfig.animalSpeed.bySituation.escaping;
                } else if (this.isHunting) {
                    situationMultiplier = simulationConfig.animalSpeed.bySituation.hunting;
                } else if (this.currentActivity === 'resting') {
                    situationMultiplier = simulationConfig.animalSpeed.bySituation.resting;
                } else if (this.currentActivity === 'exploring') {
                    situationMultiplier = simulationConfig.animalSpeed.bySituation.exploring;
                }
                
                const adjustedSpeed = this.speed * situationMultiplier;
                const movement = direction.multiplyScalar(adjustedSpeed * deltaTime);
                this.mesh.position.add(movement);
                
                // 地形の高さを取得して動物のY座標を調整
                const terrainHeight = getTerrainHeight(this.mesh.position.x, this.mesh.position.z);
                this.mesh.position.y = terrainHeight + 1; // 地面から1ユニット上
                
                // 移動方向に回転
                this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
                
                // 移動アニメーション
                if (this.characterInstance) {
                    this.characterInstance.setRunning(this.isBeingHunted);
                    this.characterInstance.move(direction, adjustedSpeed, deltaTime);
                }
                
                if (!this.lastMovingState) {
                    this.lastMovingState = true;
                }
            } else {
                // 目的地に到着
                this.onArrival();
                this.movementTarget = null;
                this.lastMovingState = false;
                
                if (this.characterInstance) {
                    this.characterInstance.setRunning(false);
                }
            }
        }
    }
    
    updateThinking() {
        const now = Date.now();
        if (!this.isThinking && now - this.lastThoughtTime > this.thinkingDuration) {
            this.think();
        }
        
        // 移動目標がない場合は強制的に行動を開始（狩り中は除く）
        if (!this.movementTarget && !this.isHunting && !this.isBeingHunted) {
            const timeSinceLastAction = now - this.lastActionTime;
            if (timeSinceLastAction > 5000) { // 5秒以上行動していない場合
                this.executeDefaultAction();
                this.lastActionTime = now;
            }
        }
    }
    
    updateHunting(deltaTime) {
        if (this.isHunting && this.huntingTarget && this.huntingTarget.isAlive) {
            // 狩りターゲットに向かって移動
            const targetPos = this.huntingTarget.mesh.position;
            const distance = this.mesh.position.distanceTo(targetPos);
            
            if (distance < 2.0) {
                // 攻撃範囲内 - 実際に狩りを開始
                if (!this.huntingStarted) {
                    addLog(`🦁 ${this.name}が${this.huntingTarget.name}を狩り始めました`, 'hunt');
                    this.huntingStarted = true;
                }
                this.attack(this.huntingTarget);
            } else {
                // ターゲットに向かって移動
                const direction = new THREE.Vector3()
                    .subVectors(targetPos, this.mesh.position)
                    .normalize();
                
                // 狩り中の速度調整
                const huntingSpeed = this.speed * simulationConfig.animalSpeed.bySituation.hunting;
                const movement = direction.multiplyScalar(huntingSpeed * deltaTime);
                this.mesh.position.add(movement);
                
                // 地形の高さを取得して動物のY座標を調整
                const terrainHeight = getTerrainHeight(this.mesh.position.x, this.mesh.position.z);
                this.mesh.position.y = terrainHeight + 1; // 地面から1ユニット上
                
                this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
                
                if (this.characterInstance) {
                    this.characterInstance.setRunning(true);
                    this.characterInstance.move(direction, huntingSpeed, deltaTime);
                }
                
                // 狩りターゲットが遠すぎる場合は狩りを停止
                if (distance > 20) {
                    this.stopHunting();
                    addLog(`🦁 ${this.name}が${this.huntingTarget.name}を見失いました`, 'hunt');
                }
            }
        } else if (this.isBeingHunted && this.hunter && this.hunter.isAlive) {
            // 逃げる
            const hunterPos = this.hunter.mesh.position;
            const direction = new THREE.Vector3()
                .subVectors(this.mesh.position, hunterPos)
                .normalize();
            
            // 逃走中の速度調整
            const escapeSpeed = this.speed * simulationConfig.animalSpeed.bySituation.escaping;
            const movement = direction.multiplyScalar(escapeSpeed * deltaTime);
            this.mesh.position.add(movement);
            
            // 地形の高さを取得して動物のY座標を調整
            const terrainHeight = getTerrainHeight(this.mesh.position.x, this.mesh.position.z);
            this.mesh.position.y = terrainHeight + 1; // 地面から1ユニット上
            
            this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
            
            if (this.characterInstance) {
                this.characterInstance.setRunning(true);
                this.characterInstance.move(direction, escapeSpeed, deltaTime);
            }
        }
    }
    
    async think() {
        if (this.isThinking || !this.isAlive) return;
        
        this.isThinking = true;
        const timeOfDay = this.getTimeOfDay();
        const nearbyAnimals = this.getNearbyAnimals();
        
        try {
            const prompt = this.buildThoughtPrompt(timeOfDay, nearbyAnimals);
            const decision = await this.simulateThought(prompt, timeOfDay, nearbyAnimals);
            this.executeDecision(decision);
        } catch (error) {
            console.error(`${this.name}の思考でエラー:`, error);
            // エラー時のデフォルト行動
            this.executeDefaultAction();
        } finally {
            this.isThinking = false;
            this.lastThoughtTime = Date.now();
            this.thinkingDuration = 3000 + Math.random() * 5000; // 3-8秒に短縮
        }
    }
    
    buildThoughtPrompt(timeOfDay, nearbyAnimals) {
        const nearbyPredators = nearbyAnimals.filter(animal => 
            animal.isPredator && animal.prey.includes(this.type)
        );
        const nearbyPrey = nearbyAnimals.filter(animal => 
            this.isPredator && this.prey.includes(animal.type)
        );
        
        // currentLocationがundefinedの場合の安全な処理
        const currentLocationName = this.currentLocation ? this.currentLocation.name : '不明';
        
        return `
            ${this.name}（${this.type}）の現在の状況：
            - HP: ${this.hp}/${this.maxHp}
            - 空腹度: ${(this.hunger * 100).toFixed(1)}%
            - 喉の渇き: ${(this.thirst * 100).toFixed(1)}%
            - 現在地: ${currentLocationName}
            - 時間帯: ${timeOfDay}
            - 近くの捕食者: ${nearbyPredators.map(a => a.name).join(', ') || 'なし'}
            - 近くの獲物: ${nearbyPrey.map(a => a.name).join(', ') || 'なし'}
            
            性格: ${this.personality.description}
            
            現在の選択肢：
            1. 食事を探す（空腹度が高い場合）
            2. 水を探す（喉の渇きが高い場合）
            3. 狩りをする（捕食者で獲物が近くにいる場合）
            4. 逃げる（捕食者が近くにいる場合）
            5. 休息する（HPが低い場合）
            6. 日課に従って移動する
            7. 安全な場所に移動する
            
            最も適切な行動を選択してください。
        `;
    }
    
    async simulateThought(prompt, timeOfDay, nearbyAnimals) {
        // APIキーが設定されている場合は実際のAPIを呼び出し
        if (apiKey && apiKey.trim() !== '') {
            try {
                const provider = getSelectedApiProvider();
                const response = await callLLM({
                    prompt: prompt,
                    systemPrompt: `あなたはサバンナに住む動物です。以下の行動から選択してください：
                    
                    1. hunt - 狩りをする（捕食者のみ）
                    2. escape - 逃げる（捕食者が近くにいる場合）
                    3. eat - 食事を探す（空腹度が高い場合）
                    4. drink - 水を探す（喉の渇きが高い場合）
                    5. rest - 休息する（HPが低い場合）
                    6. routine - 日課に従う
                    7. explore - 探索する
                    
                    回答は以下のJSON形式で返してください：
                    {
                        "action": "行動名",
                        "reason": "行動の理由（日本語で）"
                    }`,
                    maxTokens: 200,
                    temperature: 0.8,
                    provider: provider
                });
                
                try {
                    const decision = JSON.parse(response);
                    this.currentThought = decision.reason || "何か考えています...";
                    return decision;
                } catch (parseError) {
                    console.error('API応答の解析エラー:', parseError);
                    return this.executeDefaultThought();
                }
            } catch (apiError) {
                console.error('API呼び出しエラー:', apiError);
                addLog(`⚠️ ${this.name}の思考でAPIエラーが発生しました`, 'warning');
                return this.executeDefaultThought();
            }
        } else {
            // APIキーが設定されていない場合は簡易的な思考シミュレーション
            return this.executeDefaultThought();
        }
    }
    
    executeDefaultThought() {
        // 簡易的なAI思考シミュレーション
        const decisions = [
            { action: 'hunt', priority: 0 },
            { action: 'escape', priority: 0 },
            { action: 'eat', priority: 0 },
            { action: 'drink', priority: 0 },
            { action: 'rest', priority: 0 },
            { action: 'routine', priority: 0 },
            { action: 'explore', priority: 0 }
        ];
        
        // 状況に応じて優先度を調整
        if (this.hunger > 0.7) {
            decisions.find(d => d.action === 'eat').priority += 3;
            this.currentThought = "お腹が空いています...";
        }
        if (this.thirst > 0.7) {
            decisions.find(d => d.action === 'drink').priority += 3;
            this.currentThought = "喉が渇いています...";
        }
        if (this.hp < this.maxHp * 0.5) {
            decisions.find(d => d.action === 'rest').priority += 2;
            this.currentThought = "疲れています...";
        }
        
        const nearbyPredators = this.getNearbyAnimals().filter(animal => 
            animal.isPredator && animal.prey.includes(this.type)
        );
        if (nearbyPredators.length > 0) {
            decisions.find(d => d.action === 'escape').priority += 4;
            this.hunter = nearbyPredators[0];
            this.isBeingHunted = true;
            this.currentThought = "危険を感じます！";
        }
        
        const nearbyPrey = this.getNearbyAnimals().filter(animal => 
            this.isPredator && this.prey.includes(animal.type)
        );
        if (nearbyPrey.length > 0 && this.hunger > 0.3) {
            decisions.find(d => d.action === 'hunt').priority += 3;
            this.currentThought = "獲物を見つけました！";
        }
        
        // 最も優先度の高い行動を選択
        const bestDecision = decisions.reduce((best, current) => 
            current.priority > best.priority ? current : best
        );
        
        // デフォルトの思考を設定
        if (!this.currentThought) {
            switch (bestDecision.action) {
                case 'hunt':
                    this.currentThought = "狩りの準備をしています...";
                    break;
                case 'escape':
                    this.currentThought = "安全な場所を探しています...";
                    break;
                case 'eat':
                    this.currentThought = "食べ物を探しています...";
                    break;
                case 'drink':
                    this.currentThought = "水を探しています...";
                    break;
                case 'rest':
                    this.currentThought = "休息を取っています...";
                    break;
                case 'routine':
                    this.currentThought = "日課に従って行動しています...";
                    break;
                case 'explore':
                    this.currentThought = "新しい場所を探索しています...";
                    break;
                default:
                    this.currentThought = "何か考えています...";
            }
        }
        
        return bestDecision;
    }
    
    executeDecision(decision) {
        switch (decision.action) {
            case 'hunt':
                this.currentActivity = 'hunting';
                this.startHunting();
                break;
            case 'escape':
                this.currentActivity = 'escaping';
                this.findSafeLocation();
                break;
            case 'eat':
                this.currentActivity = 'eating';
                this.findFood();
                break;
            case 'drink':
                this.currentActivity = 'drinking';
                this.findWater();
                break;
            case 'rest':
                this.currentActivity = 'resting';
                this.rest();
                break;
            case 'routine':
                this.currentActivity = 'routine';
                this.followRoutine();
                break;
            case 'explore':
                this.currentActivity = 'exploring';
                this.explore();
                break;
        }
    }
    
    executeDefaultAction() {
        // デフォルト行動：状況に応じて行動を選択
        const timeOfDay = this.getTimeOfDay();
        
        // 空腹度や喉の渇きが高い場合は対応する行動を取る
        if (this.hunger > 0.5) {
            this.currentActivity = 'eating';
            this.findFood();
        } else if (this.thirst > 0.5) {
            this.currentActivity = 'drinking';
            this.findWater();
        } else if (this.hp < this.maxHp * 0.7) {
            this.currentActivity = 'resting';
            this.rest();
        } else {
            // それ以外は日課に従うか探索する
            const routineLocation = this.getRoutineLocation(timeOfDay);
            if (routineLocation && routineLocation !== this.currentLocation) {
                this.currentActivity = 'routine';
                this.moveToLocation(routineLocation);
            } else {
                this.currentActivity = 'exploring';
                this.explore();
            }
        }
    }
    
    startHunting() {
        if (!this.isPredator) return;
        
        const nearbyPrey = agents.filter(animal => 
            animal.isAlive && 
            this.prey.includes(animal.type) &&
            animal.mesh.position.distanceTo(this.mesh.position) < 10
        );
        
        if (nearbyPrey.length > 0) {
            this.huntingTarget = nearbyPrey[0];
            this.isHunting = true;
            
            // 狩り開始のログは実際に接近した時に表示
            addLog(`🦁 ${this.name}が${this.huntingTarget.name}を発見しました`, 'hunt');
        }
    }
    
    stopHunting() {
        this.isHunting = false;
        this.huntingTarget = null;
        this.huntingStarted = false; // 狩り開始フラグもリセット
    }
    
    attack(target) {
        const now = Date.now();
        if (now - this.lastAttackTime < this.attackCooldown) return;
        
        this.lastAttackTime = now;
        
        // 攻撃力と防御力の計算
        const damage = Math.max(1, this.attackPower - target.defense);
        target.hp -= damage;
        
        addLog(`⚔️ ${this.name}が${target.name}に${damage}ダメージを与えました`, 'combat');
        
        if (target.hp <= 0) {
            target.die(`${this.name}の攻撃`);
            this.stopHunting();
            this.hunger = Math.max(0, this.hunger - 0.3); // 食事で空腹度減少
        }
        
        // 攻撃アニメーション
        if (this.characterInstance) {
            this.characterInstance.startAttack();
        }
    }
    
    die(reason) {
        this.isAlive = false;
        this.hp = 0;
        addLog(`💀 ${this.name}が死亡しました（原因: ${reason}）`, 'death');
        
        // 3Dモデルを削除
        if (this.characterInstance) {
            this.characterInstance.dispose();
        }
        
        // 他の動物の関係を更新
        agents.forEach(animal => {
            if (animal.relationships.has(this.name)) {
                animal.relationships.delete(this.name);
            }
        });
    }
    
    findSafeLocation() {
        const safeLocations = locations.filter(loc => 
            !loc.isHome && 
            (loc.name === "洞穴" || loc.name === "大きな石")
        );
        
        if (safeLocations.length > 0) {
            const randomSafeLocation = safeLocations[Math.floor(Math.random() * safeLocations.length)];
            // positionがundefinedの場合の安全な処理
            if (randomSafeLocation && randomSafeLocation.position) {
                this.moveToLocation(randomSafeLocation);
            } else if (randomSafeLocation && !randomSafeLocation.position) {
                // デフォルト位置を設定
                randomSafeLocation.position = new THREE.Vector3(
                    Math.random() * 100 - 50,
                    0,
                    Math.random() * 100 - 50
                );
                this.moveToLocation(randomSafeLocation);
            }
        } else {
            addLog(`⚠️ ${this.name}が安全な場所を見つけられませんでした`, 'warning');
        }
    }
    
    getNearbyAnimals() {
        return agents.filter(animal => 
            animal.isAlive && 
            animal.name !== this.name &&
            animal.mesh.position.distanceTo(this.mesh.position) < 8
        );
    }
    
    onArrival() {
        if (this.targetLocation) {
            this.currentLocation = this.targetLocation;
            this.targetLocation = null;
            
            // currentLocationがundefinedの場合の安全な処理
            const locationName = this.currentLocation ? this.currentLocation.name : '不明';
            
            addLog(`🦁 ${this.name}が${locationName}に到着しました`, 'arrival');
            
            // 到着時の行動を決定
            if (this.hunger > 0.7) {
                this.findFood();
            } else if (this.thirst > 0.7) {
                this.findWater();
            } else if (this.hp < this.maxHp * 0.5) {
                this.rest();
            } else {
                this.explore();
            }
        }
    }
    
    getTimeOfDay() {
        const hour = Math.floor(currentTime / 60);
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        if (hour >= 18 && hour < 22) return 'evening';
        return 'night';
    }
    
    getRoutineLocation(timeOfDay) {
        const routine = this.dailyRoutine[timeOfDay];
        if (routine && routine.length > 0) {
            const locationName = routine[Math.floor(Math.random() * routine.length)];
            return locations.find(loc => loc.name === locationName);
        }
        return null;
    }
    
    findFood() {
        const foodLocations = locations.filter(loc => 
            loc.name.includes("草原") || loc.name.includes("木")
        );
        
        if (foodLocations.length > 0) {
            const randomFoodLocation = foodLocations[Math.floor(Math.random() * foodLocations.length)];
            // positionがundefinedの場合の安全な処理
            if (randomFoodLocation && randomFoodLocation.position) {
                this.moveToLocation(randomFoodLocation);
            } else if (randomFoodLocation && !randomFoodLocation.position) {
                // デフォルト位置を設定
                randomFoodLocation.position = new THREE.Vector3(
                    Math.random() * 100 - 50,
                    0,
                    Math.random() * 100 - 50
                );
                this.moveToLocation(randomFoodLocation);
            }
        } else {
            addLog(`⚠️ ${this.name}が食べ物を見つけられませんでした`, 'warning');
        }
    }
    
    findWater() {
        const waterLocations = locations.filter(loc => 
            loc.name.includes("池") || loc.name.includes("川")
        );
        
        if (waterLocations.length > 0) {
            const randomWaterLocation = waterLocations[Math.floor(Math.random() * waterLocations.length)];
            // positionがundefinedの場合の安全な処理
            if (randomWaterLocation && randomWaterLocation.position) {
                this.moveToLocation(randomWaterLocation);
            } else if (randomWaterLocation && !randomWaterLocation.position) {
                // デフォルト位置を設定
                randomWaterLocation.position = new THREE.Vector3(
                    Math.random() * 100 - 50,
                    0,
                    Math.random() * 100 - 50
                );
                this.moveToLocation(randomWaterLocation);
            }
        } else {
            addLog(`⚠️ ${this.name}が水を見つけられませんでした`, 'warning');
        }
    }
    
    rest() {
        const restLocations = locations.filter(loc => 
            loc.name.includes("洞穴") || loc.name.includes("大きな石")
        );
        
        if (restLocations.length > 0) {
            const randomRestLocation = restLocations[Math.floor(Math.random() * restLocations.length)];
            // positionがundefinedの場合の安全な処理
            if (randomRestLocation && randomRestLocation.position) {
                this.moveToLocation(randomRestLocation);
            } else if (randomRestLocation && !randomRestLocation.position) {
                // デフォルト位置を設定
                randomRestLocation.position = new THREE.Vector3(
                    Math.random() * 100 - 50,
                    0,
                    Math.random() * 100 - 50
                );
                this.moveToLocation(randomRestLocation);
            }
        } else {
            addLog(`⚠️ ${this.name}が休息場所を見つけられませんでした`, 'warning');
        }
    }
    
    followRoutine() {
        const timeOfDay = this.getTimeOfDay();
        const routineLocation = this.getRoutineLocation(timeOfDay);
        
        if (routineLocation && routineLocation.position && routineLocation !== this.currentLocation) {
            this.moveToLocation(routineLocation);
        } else if (routineLocation && !routineLocation.position && routineLocation !== this.currentLocation) {
            // positionがundefinedの場合はデフォルト位置を設定
            routineLocation.position = new THREE.Vector3(
                Math.random() * 100 - 50,
                0,
                Math.random() * 100 - 50
            );
            this.moveToLocation(routineLocation);
        } else if (!routineLocation) {
            // 日課の場所が見つからない場合は探索
            this.explore();
        }
    }
    
    explore() {
        // locationsが空の場合の安全な処理
        if (locations.length === 0) {
            addLog(`⚠️ ${this.name}の探索が失敗しました（地形が存在しません）`, 'warning');
            // 地形が存在しない場合は現在地で休息
            this.rest();
            return;
        }
        
        const randomLocation = locations[Math.floor(Math.random() * locations.length)];
        
        // location.positionがundefinedの場合の安全な処理
        if (randomLocation && randomLocation.position && randomLocation !== this.currentLocation) {
            this.moveToLocation(randomLocation);
        } else if (randomLocation && !randomLocation.position && randomLocation !== this.currentLocation) {
            // positionがundefinedの場合はデフォルト位置を設定
            randomLocation.position = new THREE.Vector3(
                Math.random() * 100 - 50,
                0,
                Math.random() * 100 - 50
            );
            this.moveToLocation(randomLocation);
        } else {
            addLog(`⚠️ ${this.name}の探索が失敗しました（適切な地形が見つかりません）`, 'warning');
            // 探索に失敗した場合は現在地で休息
            this.rest();
        }
    }
    
    updatePanelInfo() {
        // パネルに表示する情報を更新
        if (this.mesh) {
            // currentLocationがundefinedの場合の安全な処理
            const locationName = this.currentLocation ? this.currentLocation.name : '不明';
            
            this.mesh.userData = {
                name: this.name,
                type: this.type,
                hp: this.hp,
                maxHp: this.maxHp,
                hunger: this.hunger,
                thirst: this.thirst,
                location: locationName,
                thought: this.currentThought,
                isAlive: this.isAlive
            };
        }
    }
}

// 動物の作成
function createAnimals() {
    animalPersonalities.forEach((animalData, index) => {
        const animal = new Animal(animalData, index);
        agents.push(animal);
    });
    
    addLog(`🦁 サバンナに${agents.length}匹の動物が誕生しました`, 'system');
}

