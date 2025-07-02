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
        
        // 群れシステム
        this.herd = null; // 所属する群れ
        this.herdLeader = null; // 群れのリーダー
        this.isHerdLeader = false; // 自分がリーダーかどうか
        this.herdMembers = []; // 群れのメンバー
        this.herdFormation = 'loose'; // 群れの隊形（loose, tight, line）
        this.herdCohesion = 0.8; // 群れの結束度（0-1）
        
        // 繁殖システム
        this.gender = Math.random() < 0.5 ? 'male' : 'female'; // 性別
        this.age = data.age || Math.floor(Math.random() * 10) + 5; // 年齢（5-15歳）
        this.isAdult = this.age >= 8; // 成体かどうか
        this.isPregnant = false; // 妊娠中かどうか
        this.pregnancyTime = 0; // 妊娠期間
        this.pregnancyDuration = 30000; // 妊娠期間（30秒）
        this.lastBreedingTime = 0; // 最後に交配した時間
        this.breedingCooldown = 60000; // 交配クールダウン（60秒）
        this.offspring = []; // 子供のリスト
        this.parents = []; // 親のリスト
        
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
        
        // 初期状態で少し空腹と喉の渇きを設定して行動を促す
        this.hunger = 0.3 + Math.random() * 0.2; // 30-50%
        this.thirst = 0.4 + Math.random() * 0.2; // 40-60%
        
        // 3Dモデル
        this.createModel(data.color);
        
        // 移動関連
        this.movementTarget = null;
        this.lastMovingState = false; // 移動状態の変更を追跡するためのフラグ
        
        // 他の動物との関係を初期化
        this.initializeRelationships();
        
        // 群れを初期化
        this.initializeHerd();
    }
    
    createModel(color) {
        // 既存の3Dモデルを削除（再生成時のため）
        if (this.characterInstance && this.characterInstance.dispose) {
            this.characterInstance.dispose();
        }
        // Characterクラスを使ってアバターを生成（動物の種類情報を渡す）
        const gameInfo = { animalType: this.type };
        this.characterInstance = new Character(scene, 'animal', gameInfo);
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
    
    initializeHerd() {
        // 群れを形成する動物の種類を定義
        const herdAnimals = ['ゾウ', 'シマウマ', 'キリン'];
        
        if (!herdAnimals.includes(this.type)) {
            return; // 群れを形成しない動物はスキップ
        }
        
        // 既存の群れを探す
        let existingHerd = null;
        agents.forEach(other => {
            if (other.name !== this.name && 
                other.type === this.type && 
                other.herd && 
                other.herdMembers.length < 5) { // 群れの最大サイズ
                existingHerd = other.herd;
            }
        });
        
        if (existingHerd) {
            // 既存の群れに参加
            this.herd = existingHerd;
            this.herdLeader = existingHerd.leader;
            this.herdMembers = existingHerd.members;
            existingHerd.members.push(this);
            
            addLog(`🦁 ${this.name}が${this.herdLeader.name}の群れに参加しました`, 'herd');
        } else {
            // 新しい群れを作成
            this.herd = {
                id: Date.now() + Math.random(),
                leader: this,
                members: [this],
                formation: 'loose',
                cohesion: 0.8,
                lastMoveTime: Date.now()
            };
            this.isHerdLeader = true;
            this.herdLeader = this;
            this.herdMembers = [this];
            
            addLog(`🦁 ${this.name}が新しい群れを形成しました`, 'herd');
        }
    }
    
    moveToLocation(location) {
        this.targetLocation = location;
        
        // 移動開始時に思考を一時停止
        this.lastThoughtTime = Date.now();
        
        // 地形の高さを取得して移動目標を設定
        const terrainHeight = getTerrainHeight(location.position.x, location.position.z);
        
        // 群れの場合は群れ全体で移動
        if (this.herd && this.herdMembers.length > 1) {
            this.moveHerdToLocation(location);
            return;
        }
        
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
    
    moveHerdToLocation(location) {
        // 群れのリーダーが移動目標を設定
        if (!this.isHerdLeader) {
            return; // リーダー以外は個別に移動しない
        }
        
        const terrainHeight = getTerrainHeight(location.position.x, location.position.z);
        
        // 群れ全体の移動目標を設定
        this.herd.targetLocation = location;
        this.herd.movementTarget = new THREE.Vector3(
            location.position.x,
            terrainHeight + 1,
            location.position.z
        );
        this.herd.lastMoveTime = Date.now();
        
        // 群れの各メンバーに移動を指示
        this.herd.members.forEach(member => {
            if (member !== this) {
                member.targetLocation = location;
                member.movementTarget = this.herd.movementTarget.clone();
                member.currentPath = null;
            }
        });
        
        // 自分の移動目標も設定
        this.movementTarget = this.herd.movementTarget.clone();
        this.currentPath = null;
        
        // 移動方向を設定
        const direction = new THREE.Vector3()
            .subVectors(this.movementTarget, this.mesh.position)
            .normalize();
        this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
        
        const currentLocationName = this.currentLocation ? this.currentLocation.name : '不明';
        
        addLog(`🦁 ${this.herdLeader.name}の群れが${location.name}へ移動開始`, 'herd', `
                <div class="log-detail-section">
                    <h4>群れ移動の詳細</h4>
                    <p>出発地: ${currentLocationName}</p>
                    <p>目的地: ${location.name}</p>
                    <p>群れサイズ: ${this.herd.members.length}匹</p>
                    <p>リーダー: ${this.herdLeader.name}</p>
                </div>
            `);
    }
    
    update(deltaTime) {
        if (!this.isAlive) return;
        
        // 基本状態の更新
        this.updateBasicNeeds(deltaTime);
        
        // 群れ行動（Boids/Social Force）
        this.updateHerdBehavior();
        
        // 繁殖システムの更新
        this.updateBreeding(deltaTime);
        
        // 移動の更新
        this.updateMovement(deltaTime);
        
        // 思考の更新
        this.updateThinking();
        
        // 狩り・戦闘の更新
        this.updateHunting(deltaTime);
        
        // 現在地での行動を定期的に実行
        this.updateLocationAction(deltaTime);
        
        // 3Dモデルのアニメーション更新
        if (this.characterInstance) {
            this.characterInstance.update(deltaTime);
        }
        
        // パネル情報の更新
        this.updatePanelInfo();
    }
    
    updateBasicNeeds(deltaTime) {
        // 時間経過で基本ニーズが増加（より早く増加するように調整）
        const timeScale = deltaTime / 1000; // 秒単位に変換
        
        // 空腹度と喉の渇きをより早く増加
        this.hunger = Math.min(1.0, this.hunger + 0.05 * timeScale); // 0.02から0.05に増加
        this.thirst = Math.min(1.0, this.thirst + 0.06 * timeScale); // 0.03から0.06に増加
        
        // エネルギーは徐々に減少
        this.energy = Math.max(0.0, this.energy - 0.01 * timeScale);
        
        // HPが低い場合は徐々に回復
        if (this.hp < this.maxHp && this.energy > 0.5) {
            this.hp = Math.min(this.maxHp, this.hp + 0.5 * timeScale);
        }
        
        // 年齢の進行（非常にゆっくり）
        this.age += 0.0001 * timeScale; // 1時間で約0.36歳増加
        this.isAdult = this.age >= 8;
    }
    
    updateBreeding(deltaTime) {
        if (!this.isAlive || !this.isAdult) return;
        
        const now = Date.now();
        
        // 妊娠中の場合は出産チェック
        if (this.isPregnant) {
            this.pregnancyTime += deltaTime;
            
            if (this.pregnancyTime >= this.pregnancyDuration) {
                this.giveBirth();
            }
        }
        
        // 交配可能な相手を探す
        if (this.gender === 'female' && !this.isPregnant && 
            now - this.lastBreedingTime > this.breedingCooldown) {
            this.findBreedingPartner();
        }
    }
    
    updateMovement(deltaTime) {
        // 狩り中は移動目標による移動を無効にする（updateHuntingで処理）
        if (this.isHunting && this.huntingTarget) {
            return;
        }
        
        // 群れの場合は群れでの移動を処理
        if (this.herd && this.herdMembers.length > 1) {
            this.updateHerdMovement(deltaTime);
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
                
                // アニメーションを完全に停止
                if (this.characterInstance) {
                    this.characterInstance.setRunning(false);
                    // 移動アニメーションを停止
                    if (this.characterInstance.stopMoving) {
                        this.characterInstance.stopMoving();
                    }
                }
            }
        }
    }
    
    updateHerdMovement(deltaTime) {
        if (!this.herd || !this.herd.movementTarget) {
            return;
        }
        
        const distance = this.mesh.position.distanceTo(this.herd.movementTarget);
        
        if (distance > 0.5) {
            // 群れのリーダーに追従
            const leaderDirection = new THREE.Vector3()
                .subVectors(this.herd.movementTarget, this.mesh.position)
                .normalize();
            
            // 群れの隊形に応じた位置調整
            let targetPosition = this.herd.movementTarget.clone();
            if (!this.isHerdLeader) {
                targetPosition = this.calculateHerdPosition();
            }
            
            const direction = new THREE.Vector3()
                .subVectors(targetPosition, this.mesh.position)
                .normalize();
            
            // 群れでの移動速度調整
            let situationMultiplier = simulationConfig.animalSpeed.bySituation.normal;
            if (this.isBeingHunted) {
                situationMultiplier = simulationConfig.animalSpeed.bySituation.escaping;
            } else if (this.currentActivity === 'resting') {
                situationMultiplier = simulationConfig.animalSpeed.bySituation.resting;
            }
            
            const adjustedSpeed = this.speed * situationMultiplier * this.herdCohesion;
            const movement = direction.multiplyScalar(adjustedSpeed * deltaTime);
            this.mesh.position.add(movement);
            
            // 地形の高さを取得して動物のY座標を調整
            const terrainHeight = getTerrainHeight(this.mesh.position.x, this.mesh.position.z);
            this.mesh.position.y = terrainHeight + 1;
            
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
            // 群れの目的地に到着
            if (this.isHerdLeader) {
                this.onArrival();
                this.herd.movementTarget = null;
                this.herd.members.forEach(member => {
                    member.movementTarget = null;
                    member.lastMovingState = false;
                    if (member.characterInstance) {
                        member.characterInstance.setRunning(false);
                        if (member.characterInstance.stopMoving) {
                            member.characterInstance.stopMoving();
                        }
                    }
                });
            }
            this.lastMovingState = false;
            
            // 逃避が終了した場合の処理
            if (this.isBeingHunted) {
                this.isBeingHunted = false;
                this.hunter = null;
                this.currentActivity = 'resting';
                this.currentThought = '安全な場所に逃げ切りました...';
                addLog(`😌 ${this.name}が安全な場所に逃げ切りました`, 'escape');
            }
            
            // アニメーションを停止
            if (this.characterInstance) {
                this.characterInstance.setRunning(false);
                if (this.characterInstance.stopMoving) {
                    this.characterInstance.stopMoving();
                }
            }
        }
    }
    
    calculateHerdPosition() {
        if (!this.herd || !this.herd.movementTarget) {
            return this.mesh.position;
        }
        
        const leaderPos = this.herd.movementTarget;
        const memberIndex = this.herd.members.indexOf(this);
        
        // 群れの隊形に応じた位置を計算
        switch (this.herd.formation) {
            case 'line':
                // 縦列隊形
                const lineOffset = (memberIndex - 1) * 3; // 3ユニット間隔
                return new THREE.Vector3(
                    leaderPos.x,
                    leaderPos.y,
                    leaderPos.z + lineOffset
                );
            case 'tight':
                // 密集隊形
                const angle = (memberIndex - 1) * (2 * Math.PI / this.herd.members.length);
                const radius = 2;
                return new THREE.Vector3(
                    leaderPos.x + Math.cos(angle) * radius,
                    leaderPos.y,
                    leaderPos.z + Math.sin(angle) * radius
                );
            default: // 'loose'
                // 緩やかな隊形
                const looseAngle = (memberIndex - 1) * (2 * Math.PI / this.herd.members.length);
                const looseRadius = 4 + Math.random() * 2;
                return new THREE.Vector3(
                    leaderPos.x + Math.cos(looseAngle) * looseRadius,
                    leaderPos.y,
                    leaderPos.z + Math.sin(looseAngle) * looseRadius
                );
        }
    }
    
    updateThinking() {
        const now = Date.now();
        
        // 逃避チェックを最優先
        if (this.shouldEscape()) {
            this.escapeFromPredator();
            return;
        }
        
        if (!this.isThinking && now - this.lastThoughtTime > this.thinkingDuration) {
            this.think();
        }
        
        // 移動目標がない場合は強制的に行動を開始（狩り中は除く）
        if (!this.movementTarget && !this.isHunting && !this.isBeingHunted) {
            const timeSinceLastAction = now - this.lastActionTime;
            if (timeSinceLastAction > 3000) { // 5秒から3秒に短縮
                this.executeDefaultAction();
                this.lastActionTime = now;
            }
        }
    }
    
    updateLocationAction(deltaTime) {
        // 移動中や狩り中は現在地での行動を実行しない
        if (this.movementTarget || this.isHunting || this.isBeingHunted) {
            return;
        }
        
        // 現在地での行動を定期的に実行（5秒ごと）
        const now = Date.now();
        if (!this.lastLocationActionTime) {
            this.lastLocationActionTime = now;
        }
        
        if (now - this.lastLocationActionTime > 5000) { // 5秒間隔
            this.performLocationAction();
            this.lastLocationActionTime = now;
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
                    // アニメーションを停止
                    if (this.characterInstance) {
                        this.characterInstance.setRunning(false);
                        if (this.characterInstance.stopMoving) {
                            this.characterInstance.stopMoving();
                        }
                    }
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
            
            利用可能な地形：
            - 川: 水を飲む場所
            - 低地草原: 草食動物の食事場所、狩りの場所
            - 森林: 木の葉を食べる場所、休息場所
            - 丘陵: ライオンの休息場所、見張り場所
            - 山地: 隠れ場所、安全な場所
            - 高山: 見張り場所
            
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
        } else if (this.isPredator && this.hunger > 0.5) {
            // 肉食動物で空腹度が高い場合は狩りを優先
            decisions.find(d => d.action === 'hunt').priority += 2;
            this.currentThought = "お腹が空いて獲物を探しています...";
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
        if (this.hunger > 0.3) { // 0.5から0.3に下げる
            this.currentActivity = 'eating';
            this.findFood();
        } else if (this.thirst > 0.3) { // 0.5から0.3に下げる
            this.currentActivity = 'drinking';
            this.findWater();
        } else if (this.hp < this.maxHp * 0.7) {
            this.currentActivity = 'resting';
            this.rest();
        } else {
            // それ以外は日課に従うか探索する
            const routineLocation = this.getRoutineLocation(timeOfDay);
            if (routineLocation) {
                this.currentActivity = 'routine';
                this.followRoutine();
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
            animal.mesh.position.distanceTo(this.mesh.position) < 15 // 狩り範囲を拡大
        );
        
        if (nearbyPrey.length > 0) {
            // 最も近い獲物を選択
            let closestPrey = nearbyPrey[0];
            let closestDistance = this.mesh.position.distanceTo(closestPrey.mesh.position);
            
            nearbyPrey.forEach(prey => {
                const distance = this.mesh.position.distanceTo(prey.mesh.position);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestPrey = prey;
                }
            });
            
            this.huntingTarget = closestPrey;
            this.isHunting = true;
            this.currentActivity = 'hunting';
            this.currentThought = `${this.huntingTarget.name}を追跡しています...`;
            
            addLog(`🦁 ${this.name}が${this.huntingTarget.name}を発見しました`, 'hunt');
        } else {
            // 獲物が見つからない場合は探索
            this.currentActivity = 'exploring';
            this.currentThought = '獲物を探しています...';
        }
    }
    
    stopHunting() {
        this.isHunting = false;
        this.huntingTarget = null;
        this.huntingStarted = false; // 狩り開始フラグもリセット
        
        // アニメーションを停止
        if (this.characterInstance) {
            this.characterInstance.setRunning(false);
            if (this.characterInstance.stopMoving) {
                this.characterInstance.stopMoving();
            }
        }
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
            this.eatPrey(target); // 獲物を食べる処理
        }
        
        // 攻撃アニメーション
        if (this.characterInstance) {
            this.characterInstance.startAttack();
        }
    }
    
    eatPrey(prey) {
        if (!this.isPredator) return; // 肉食動物のみ
        
        // 獲物のサイズに応じた空腹度回復
        const preySize = prey.size || 1.0;
        const hungerRecovery = Math.min(0.6, preySize * 0.4); // 獲物のサイズに応じて回復量を調整
        
        this.hunger = Math.max(0, this.hunger - hungerRecovery);
        
        // 行動と思考を更新
        this.currentActivity = 'eating';
        this.currentThought = `${prey.name}の肉を食べています...`;
        
        addLog(`🍖 ${this.name}が${prey.name}を食べました (空腹度: ${(this.hunger * 100).toFixed(1)}%)`, 'hunt');
        
        // 食事の後は休息
        setTimeout(() => {
            this.currentActivity = 'resting';
            this.currentThought = '獲物を食べて満足しています...';
        }, 5000);
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
        // 安全な場所は森林や山地
        const safeLocation = this.findSuitableTerrainForActivity('hiding');
        this.moveToLocation(safeLocation);
    }
    
    escapeFromPredator() {
        if (!this.hunter || !this.isBeingHunted) return;
        
        // 捕食者から遠ざかる方向を計算
        const predatorPos = this.hunter.mesh.position;
        const escapeDirection = new THREE.Vector3()
            .subVectors(this.mesh.position, predatorPos)
            .normalize();
        
        // 逃避距離を計算（より遠くまで逃げる）
        const escapeDistance = 30 + Math.random() * 20; // 30-50ユニット
        const escapeTarget = new THREE.Vector3()
            .copy(this.mesh.position)
            .add(escapeDirection.multiplyScalar(escapeDistance));
        
        // 逃避先の地形を取得
        let escapeHeight = 0;
        try {
            if (typeof getTerrainHeight === 'function') {
                escapeHeight = getTerrainHeight(escapeTarget.x, escapeTarget.z);
            }
        } catch (error) {
            escapeHeight = 0;
        }
        
        // 逃避先の地形タイプを判定
        let terrainType = '低地草原';
        for (const [terrainName, range] of Object.entries(terrainConfig.heightRanges)) {
            if (escapeHeight >= range.min && escapeHeight < range.max) {
                terrainType = terrainName;
                break;
            }
        }
        
        // 安全な地形（森林や山地）を優先
        if (terrainType !== '森林' && terrainType !== '山地') {
            // 森林や山地の方向に調整
            const forestLocation = this.findLocationByTerrainType('森林');
            if (forestLocation) {
                escapeTarget.copy(forestLocation.position);
            }
        }
        
        // 逃避先を設定
        const escapeLocation = {
            name: terrainType,
            position: new THREE.Vector3(escapeTarget.x, escapeHeight + 1, escapeTarget.z),
            type: terrainType
        };
        
        this.moveToLocation(escapeLocation);
        this.currentActivity = 'escaping';
        this.currentThought = `${this.hunter.name}から逃げています！`;
        
        addLog(`🏃 ${this.name}が${this.hunter.name}から逃避開始`, 'escape');
    }
    
    getNearbyAnimals() {
        return agents.filter(animal => 
            animal.isAlive && 
            animal.name !== this.name &&
            animal.mesh.position.distanceTo(this.mesh.position) < 12 // 感知範囲を拡大
        );
    }
    
    getNearbyPredators() {
        return this.getNearbyAnimals().filter(animal => 
            animal.isPredator && animal.prey.includes(this.type)
        );
    }
    
    shouldEscape() {
        // 草食動物で、近くに捕食者がいる場合
        if (!this.isPredator) {
            const nearbyPredators = this.getNearbyPredators();
            if (nearbyPredators.length > 0) {
                // 最も近い捕食者との距離をチェック
                const closestPredator = nearbyPredators[0];
                const distance = this.mesh.position.distanceTo(closestPredator.mesh.position);
                
                // 距離が10ユニット以内なら逃避
                if (distance < 10) {
                    this.hunter = closestPredator;
                    this.isBeingHunted = true;
                    return true;
                }
            }
        }
        return false;
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
            
            // 現在地に応じた行動を実行
            this.performLocationAction();
        }
    }
    
    performLocationAction() {
        if (!this.currentLocation) return;
        
        const locationName = this.currentLocation.name;
        
        // 川にいる場合は水を飲む
        if (locationName === '川' && this.thirst > 0.1) {
            this.drinkWater();
        }
        // 低地草原にいる場合は食事をする
        else if (locationName === '低地草原' && this.hunger > 0.1) {
            this.eatFood();
        }
        // 森林にいる場合は食事または休息
        else if (locationName === '森林') {
            if (this.hunger > 0.1) {
                this.eatFood();
            } else if (this.energy < 0.8) {
                this.restAtLocation();
            }
        }
        // 丘陵にいる場合は休息
        else if (locationName === '丘陵' && this.energy < 0.8) {
            this.restAtLocation();
        }
    }
    
    drinkWater() {
        if (this.thirst <= 0.1) return; // 既に十分水分を取っている場合
        
        // 水を飲む処理
        const waterAmount = Math.min(0.4, this.thirst); // 最大0.4回復
        this.thirst = Math.max(0, this.thirst - waterAmount);
        
        // 行動を更新
        this.currentActivity = 'drinking';
        this.currentThought = '川の水を飲んでいます...';
        
        addLog(`💧 ${this.name}が川の水を飲みました (喉の渇き: ${(this.thirst * 100).toFixed(1)}%)`, 'activity');
        
        // 水を飲んだ後は少し休息
        setTimeout(() => {
            this.currentActivity = 'resting';
            this.currentThought = '水を飲んで満足しています...';
        }, 3000);
    }
    
    eatFood() {
        if (this.hunger <= 0.1) return; // 既に十分食事を取っている場合
        
        // 食事の処理
        const foodAmount = Math.min(0.3, this.hunger); // 最大0.3回復
        this.hunger = Math.max(0, this.hunger - foodAmount);
        
        // 現在地と動物の種類に応じた食事の内容
        let foodType = '草';
        let thought = '草原の草を食べています...';
        
        if (this.type === 'キリン') {
            if (this.currentLocation && this.currentLocation.name === '森林') {
                foodType = '木の葉';
                thought = '高い木の葉を食べています...';
            } else {
                foodType = '木の葉';
                thought = '木の葉を食べています...';
            }
        } else if (this.type === 'ゾウ') {
            if (this.currentLocation && this.currentLocation.name === '森林') {
                foodType = '果物';
                thought = '森の果物を食べています...';
            } else {
                foodType = '草';
                thought = '草原の草を食べています...';
            }
        } else if (this.type === 'シマウマ') {
            if (this.currentLocation && this.currentLocation.name === '森林') {
                foodType = '木の実';
                thought = '森の木の実を食べています...';
            } else {
                foodType = '草';
                thought = '草原の草を食べています...';
            }
        } else if (this.type === 'ライオン' || this.type === 'ハイエナ') {
            // 肉食動物は獲物を探す必要がある
            if (this.hunger > 0.5) {
                // 空腹度が高い場合は狩りを開始
                this.startHunting();
                foodType = '獲物を探している';
                thought = '獲物を探しています...';
            } else {
                foodType = '残った肉';
                thought = '残った肉を食べています...';
            }
        }
        
        // 行動を更新
        this.currentActivity = 'eating';
        this.currentThought = thought;
        
        addLog(`🍃 ${this.name}が${foodType}を食べました (空腹度: ${(this.hunger * 100).toFixed(1)}%)`, 'activity');
        
        // 食事の後は少し休息
        setTimeout(() => {
            this.currentActivity = 'resting';
            this.currentThought = '食事を終えて満足しています...';
        }, 3000);
    }
    
    restAtLocation() {
        if (this.energy >= 0.9) return; // 既に十分エネルギーがある場合
        
        // 休息の処理
        const energyGain = Math.min(0.2, 1.0 - this.energy); // 最大0.2回復
        this.energy = Math.min(1.0, this.energy + energyGain);
        
        // 行動を更新
        this.currentActivity = 'resting';
        this.currentThought = '森林で休息を取っています...';
        
        addLog(`😴 ${this.name}が休息を取りました (エネルギー: ${(this.energy * 100).toFixed(1)}%)`, 'activity');
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
            return locationName; // 地形タイプの名前を返す
        }
        return null;
    }
    
    findFood() {
        const foodLocation = this.findSuitableTerrainForActivity('eating');
        this.moveToLocation(foodLocation);
    }
    
    findWater() {
        const waterLocation = this.findSuitableTerrainForActivity('drinking');
        this.moveToLocation(waterLocation);
    }
    
    rest() {
        const restLocation = this.findSuitableTerrainForActivity('resting');
        this.moveToLocation(restLocation);
    }
    
    followRoutine() {
        const timeOfDay = this.getTimeOfDay();
        const routineLocation = this.getRoutineLocation(timeOfDay);
        
        if (routineLocation) {
            // 日課の地形タイプに基づいて適切な場所を見つける
            const terrainLocation = this.findLocationByTerrainType(routineLocation);
            this.moveToLocation(terrainLocation);
        } else {
            // 日課の場所が見つからない場合は探索
            this.explore();
        }
    }
    
    explore() {
        // 探索はより遠くの場所を選ぶ
        const exploreLocation = this.findSuitableTerrainForActivity('exploring');
        
        // 現在地から十分離れた場所を探索
        if (exploreLocation && this.mesh) {
            const currentPos = this.mesh.position;
            const targetPos = exploreLocation.position;
            const distance = currentPos.distanceTo(targetPos);
            
            // 距離が短すぎる場合は、より遠い場所を探す
            if (distance < 50) {
                const farLocation = this.findFarLocation();
                if (farLocation) {
                    this.moveToLocation(farLocation);
                    return;
                }
            }
        }
        
        this.moveToLocation(exploreLocation);
    }
    
    findFarLocation() {
        // 現在地から遠い場所を探す
        const maxAttempts = 30;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            // 現在地から100-200ユニット離れた場所を探す
            const angle = Math.random() * 2 * Math.PI;
            const distance = 100 + Math.random() * 100;
            
            const currentX = this.mesh ? this.mesh.position.x : 0;
            const currentZ = this.mesh ? this.mesh.position.z : 0;
            
            const x = currentX + Math.cos(angle) * distance;
            const z = currentZ + Math.sin(angle) * distance;
            
            // 地形の高さを取得
            let height = 0;
            try {
                if (typeof getTerrainHeight === 'function') {
                    height = getTerrainHeight(x, z);
                }
            } catch (error) {
                height = 0;
            }
            
            // 地形タイプを判定
            let terrainType = '低地草原';
            for (const [terrainName, range] of Object.entries(terrainConfig.heightRanges)) {
                if (height >= range.min && height < range.max) {
                    terrainType = terrainName;
                    break;
                }
            }
            
            // 川以外の地形なら採用
            if (terrainType !== '川') {
                return {
                    name: terrainType,
                    position: new THREE.Vector3(x, height + 1, z),
                    type: terrainType
                };
            }
            
            attempts++;
        }
        
        return null;
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
                isAlive: this.isAlive,
                gender: this.gender,
                age: Math.floor(this.age),
                isPregnant: this.isPregnant,
                offspringCount: this.offspring.length
            };
        }
    }
    
    findBreedingPartner() {
        // 同じ種類の成体のオスを探す
        const potentialPartners = agents.filter(animal => 
            animal.isAlive && 
            animal.type === this.type &&
            animal.gender === 'male' &&
            animal.isAdult &&
            animal.name !== this.name &&
            animal.mesh.position.distanceTo(this.mesh.position) < 10 // 10ユニット以内
        );
        
        if (potentialPartners.length > 0) {
            // 最も近い相手を選択
            let closestPartner = potentialPartners[0];
            let closestDistance = this.mesh.position.distanceTo(closestPartner.mesh.position);
            
            potentialPartners.forEach(partner => {
                const distance = this.mesh.position.distanceTo(partner.mesh.position);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestPartner = partner;
                }
            });
            
            // 交配を実行
            this.breed(closestPartner);
        }
    }
    
    breed(partner) {
        if (!this.isAlive || !partner.isAlive || this.isPregnant) return;
        
        const now = Date.now();
        
        // 両方の動物が交配クールダウン中でないことを確認
        if (now - this.lastBreedingTime < this.breedingCooldown ||
            now - partner.lastBreedingTime < partner.breedingCooldown) {
            return;
        }
        
        // 妊娠確率（70%）
        if (Math.random() < 0.7) {
            this.isPregnant = true;
            this.pregnancyTime = 0;
            this.lastBreedingTime = now;
            partner.lastBreedingTime = now;
            
            // 親の情報を記録
            this.parents = [this.name, partner.name];
            partner.parents = [this.name, partner.name];
            
            addLog(`💕 ${this.name}と${partner.name}が交配しました！${this.name}が妊娠しました`, 'breeding');
            
            // 妊娠中の思考を更新
            this.currentThought = '新しい命を宿しています...';
            this.currentActivity = 'resting';
        }
    }
    
    giveBirth() {
        if (!this.isPregnant) return;
        
        // 子供の数を決定（1-3匹）
        const offspringCount = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < offspringCount; i++) {
            this.createOffspring();
        }
        
        // 妊娠状態をリセット
        this.isPregnant = false;
        this.pregnancyTime = 0;
        
        addLog(`👶 ${this.name}が${offspringCount}匹の子供を産みました！`, 'birth');
        
        // 出産後の思考を更新
        this.currentThought = '子供たちを大切に育てます...';
        this.currentActivity = 'resting';
    }
    
    createOffspring() {
        // 子供の基本データを作成
        const childData = {
            name: `${this.type}の子供${Math.floor(Math.random() * 1000)}`,
            type: this.type,
            age: 1, // 子供は1歳から開始
            personality: this.personality, // 親の性格を継承
            dailyRoutine: this.dailyRoutine, // 親の日課を継承
            hp: this.maxHp * 0.5, // 子供はHPが低い
            maxHp: this.maxHp * 0.5,
            isPredator: this.isPredator,
            prey: this.prey,
            color: this.mesh ? this.mesh.userData.color : 0xffffff
        };
        
        // 子供の動物を作成
        const child = new Animal(childData, agents.length);
        
        // 子供の位置を親の近くに設定
        const offsetX = (Math.random() - 0.5) * 3;
        const offsetZ = (Math.random() - 0.5) * 3;
        child.characterInstance.setPosition(
            this.mesh.position.x + offsetX,
            this.mesh.position.y,
            this.mesh.position.z + offsetZ
        );
        
        // 親子関係を設定
        child.parents = [this.name];
        this.offspring.push(child.name);
        
        // 群れに参加させる
        if (this.herd) {
            child.herd = this.herd;
            child.herdLeader = this.herdLeader;
            child.herdMembers = this.herd.members;
            this.herd.members.push(child);
            child.herdMembers = this.herd.members;
        }
        
        // エージェントリストに追加
        agents.push(child);
        
        addLog(`🐾 ${child.name}が誕生しました！`, 'birth');
    }
    
    // 地形タイプに基づいて適切な場所を見つける関数
    findLocationByTerrainType(terrainType) {
        // サバンナの範囲内でランダムな位置を生成（範囲を拡大）
        const maxAttempts = 50;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const x = (Math.random() - 0.5) * 400; // -200 から 200（範囲を2倍に拡大）
            const z = (Math.random() - 0.5) * 400; // -200 から 200（範囲を2倍に拡大）
            
            // 地形の高さを取得
            let height = 0;
            try {
                if (typeof getTerrainHeight === 'function') {
                    height = getTerrainHeight(x, z);
                } else {
                    // getTerrainHeight関数が利用できない場合は、地形範囲の中央値を使用
                    const terrainRange = terrainConfig.heightRanges[terrainType];
                    if (terrainRange) {
                        height = (terrainRange.min + terrainRange.max) / 2;
                    }
                }
            } catch (error) {
                // エラーが発生した場合は、地形範囲の中央値を使用
                const terrainRange = terrainConfig.heightRanges[terrainType];
                if (terrainRange) {
                    height = (terrainRange.min + terrainRange.max) / 2;
                }
            }
            
            // 指定された地形タイプの範囲内かチェック
            const terrainRange = terrainConfig.heightRanges[terrainType];
            if (terrainRange && height >= terrainRange.min && height < terrainRange.max) {
                return {
                    name: terrainType,
                    position: new THREE.Vector3(x, height, z),
                    type: terrainType
                };
            }
            
            attempts++;
        }
        
        // 適切な位置が見つからない場合は、現在地の近くでランダムな位置を返す（範囲を拡大）
        const currentX = this.mesh ? this.mesh.position.x : 0;
        const currentZ = this.mesh ? this.mesh.position.z : 0;
        const randomX = currentX + (Math.random() - 0.5) * 60; // 20から60に拡大
        const randomZ = currentZ + (Math.random() - 0.5) * 60; // 20から60に拡大
        
        return {
            name: terrainType,
            position: new THREE.Vector3(randomX, 0, randomZ),
            type: terrainType
        };
    }
    
    // 動物の種類に応じた適切な地形を見つける関数
    findSuitableTerrainForActivity(activity) {
        const animalInfo = animalTypes[this.type];
        
        switch (activity) {
            case 'drinking':
                // 水を飲む場合は川に行く
                return this.findLocationByTerrainType('川');
                
            case 'eating':
                // 食事の種類に応じて地形を選択
                if (this.type === 'キリン') {
                    // キリンは木の葉を食べるので森林に行く
                    return this.findLocationByTerrainType('森林');
                } else if (this.type === 'ゾウ') {
                    // ゾウは草を食べるので低地草原に行く
                    return this.findLocationByTerrainType('低地草原');
                } else if (this.type === 'ライオン' || this.type === 'ハイエナ') {
                    // 肉食動物は狩りをするので低地草原に行く
                    return this.findLocationByTerrainType('低地草原');
                } else {
                    // その他の動物は低地草原で草を食べる
                    return this.findLocationByTerrainType('低地草原');
                }
                
            case 'resting':
                // 休息場所は動物の種類に応じて選択
                if (this.type === 'ライオン') {
                    // ライオンは丘陵で休息する
                    return this.findLocationByTerrainType('丘陵');
                } else if (this.type === 'ゾウ') {
                    // ゾウは低地草原で休息する
                    return this.findLocationByTerrainType('低地草原');
                } else {
                    // その他の動物は森林で休息する
                    return this.findLocationByTerrainType('森林');
                }
                
            case 'hiding':
                // 隠れる場所は森林や山地
                if (Math.random() < 0.5) {
                    return this.findLocationByTerrainType('森林');
                } else {
                    return this.findLocationByTerrainType('山地');
                }
                
            case 'exploring':
                // 探索は動物の好みに応じて
                const preferredTerrains = animalInfo.preferredTerrain || ['低地草原'];
                const randomTerrain = preferredTerrains[Math.floor(Math.random() * preferredTerrains.length)];
                return this.findLocationByTerrainType(randomTerrain);
                
            default:
                // デフォルトは低地草原
                return this.findLocationByTerrainType('低地草原');
        }
    }

    // 群れ行動（Boids＋Social Force Model）
    updateHerdBehavior() {
        // 群れ行動をする動物のみ
        const herdAnimals = ['ゾウ', 'シマウマ', 'キリン', 'トムソンガゼル', 'ミーアキャット'];
        if (!herdAnimals.includes(this.type)) return;
        if (this.movementTarget) return; // 目的地がある場合は通常移動
        if (!this.isAlive) return;

        // 近くの仲間を取得
        const neighbors = agents.filter(a =>
            a !== this && a.type === this.type && a.isAlive &&
            a.mesh && this.mesh &&
            a.mesh.position.distanceTo(this.mesh.position) < 10
        );
        if (neighbors.length === 0) return;

        // Boidsルール
        let separation = new THREE.Vector3();
        let alignment = new THREE.Vector3();
        let cohesion = new THREE.Vector3();
        let count = 0;
        neighbors.forEach(n => {
            // 分離
            let diff = new THREE.Vector3().subVectors(this.mesh.position, n.mesh.position);
            let dist = diff.length();
            if (dist > 0) {
                separation.add(diff.divideScalar(dist * dist));
            }
            // 整列
            if (n.mesh && n.mesh.position) {
                alignment.add(n.mesh.position);
                cohesion.add(n.mesh.position);
                count++;
            }
        });
        if (count > 0) {
            alignment.divideScalar(count).sub(this.mesh.position);
            cohesion.divideScalar(count).sub(this.mesh.position);
        }
        // Social Force: 捕食者・障害物への斥力（簡易例: 捕食者から離れる）
        let predatorRepel = new THREE.Vector3();
        const predators = agents.filter(a => a.isPredator && a.isAlive && a.prey && a.prey.includes(this.type));
        predators.forEach(pred => {
            if (pred.mesh && this.mesh) {
                let diff = new THREE.Vector3().subVectors(this.mesh.position, pred.mesh.position);
                let dist = diff.length();
                if (dist < 15 && dist > 0) {
                    predatorRepel.add(diff.normalize().multiplyScalar(15 - dist));
                }
            }
        });
        // 総合ベクトル
        let moveVec = new THREE.Vector3();
        moveVec.add(separation.multiplyScalar(1.5))
               .add(alignment.multiplyScalar(1.0))
               .add(cohesion.multiplyScalar(1.0))
               .add(predatorRepel.multiplyScalar(2.0));
        if (moveVec.length() > 0.01) {
            moveVec.normalize();
            // 実際の移動
            this.mesh.position.add(moveVec.multiplyScalar(this.speed * 10));
            // 地形の高さを調整
            const terrainHeight = getTerrainHeight(this.mesh.position.x, this.mesh.position.z);
            this.mesh.position.y = terrainHeight + 1;
            // アニメーション
            if (this.characterInstance) {
                this.characterInstance.setRunning(false);
                this.characterInstance.move(moveVec, this.speed, 16); // deltaTime相当
            }
        }
    }
}

// 動物の作成
function createAnimals() {
    animalPersonalities.forEach((animalData, index) => {
        const animal = new Animal(animalData, index);
        agents.push(animal);
    });
    
    // 群れ情報を更新
    agents.forEach(animal => {
        if (animal.herd) {
            animal.herdMembers = animal.herd.members;
        }
    });
    
    addLog(`🦁 サバンナに${agents.length}匹の動物が誕生しました`, 'system');
}

