// 4足歩行動物キャラクター作成用のクラス
class Character {
	constructor(scene, type, game) {
		//console.log("4足歩行動物キャラクター作成");
		this.scene=scene;
		this.type=type;
		this.game=game;
		this.character=new THREE.Group();
		this.scene.add(this.character);

		// アニメーション用の変数
		this.animationTime=0;
		this.isMoving=false;
		this.isRunning=false;
		this.animationSpeed=30.0;
		this.walkAmplitude = 0.3;
		this.legSwingAmplitude = 1.2;

		// 移動関連の変数
		this.position=new THREE.Vector3();
		this.rotation=new THREE.Euler();
		this.velocity=new THREE.Vector3();

		// 攻撃アニメーション用の変数
		this.isAttacking = false;
		this.attackTime = 0;
		this.attackDuration = 0.5;

		// ジャンプアニメーション用の変数
		this.isJumping = false;
		this.jumpTime = 0;
		this.jumpDuration = 0.8;
		this.jumpHeight = 0.8;

		// 倒れるアニメーション用の変数
		this.isFalling = false;
		this.fallTime = 0;
		this.fallDuration = 1.0;

		// キャラクターの作成
		this.createCharacter();
	}

	createCharacter() {
		// 動物の色を設定
		const colorA = 0xffffff;
		const colorB = 0xffffff;

		// ルートボーン（胴体の中心）
		this.rootBone = new THREE.Bone();
		this.rootBone.position.y = 1.0;

		// 胴体ボーン
		this.bodyBone = new THREE.Bone();
		this.bodyBone.position.y = 0;
		this.rootBone.add(this.bodyBone);

		// 胴体メッシュ（線）
		const bodyGeometry = new THREE.BoxGeometry(1.5, 0.8, 2.5);
		const bodyEdges = new THREE.EdgesGeometry(bodyGeometry);
		this.bodyMesh = new THREE.LineSegments(bodyEdges, new THREE.LineBasicMaterial({ color: colorA, linewidth: 2 }));
		this.bodyMesh.position.y = 0;
		this.bodyBone.add(this.bodyMesh);

		// 首ボーン
		this.neckBone = new THREE.Bone();
		this.neckBone.position.set(0, 0.4, 1.2);
		this.bodyBone.add(this.neckBone);

		// 首メッシュ（線）
		const neckGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.6);
		const neckEdges = new THREE.EdgesGeometry(neckGeometry);
		this.neckMesh = new THREE.LineSegments(neckEdges, new THREE.LineBasicMaterial({ color: colorA, linewidth: 2 }));
		this.neckMesh.position.y = 0;
		this.neckBone.add(this.neckMesh);

		// 頭ボーン
		this.headBone = new THREE.Bone();
		this.headBone.position.set(0, 0, 0.5);
		this.neckBone.add(this.headBone);

		// 頭メッシュ（線）
		const headGeometry = new THREE.BoxGeometry(0.6, 0.5, 0.8);
		const headEdges = new THREE.EdgesGeometry(headGeometry);
		this.headMesh = new THREE.LineSegments(headEdges, new THREE.LineBasicMaterial({ color: colorA, linewidth: 2 }));
		this.headMesh.position.y = 0;
		this.headBone.add(this.headMesh);

		// 前脚（左）
		this.frontLeftShoulderBone = new THREE.Bone();
		this.frontLeftShoulderBone.position.set(0.8, -0.2, 0.8);
		this.bodyBone.add(this.frontLeftShoulderBone);
		
		const frontLeftUpperLegGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
		const frontLeftUpperLegEdges = new THREE.EdgesGeometry(frontLeftUpperLegGeometry);
		this.frontLeftUpperLegMesh = new THREE.LineSegments(frontLeftUpperLegEdges, new THREE.LineBasicMaterial({ color: colorB, linewidth: 2 }));
		this.frontLeftUpperLegMesh.position.y = -0.4;
		this.frontLeftShoulderBone.add(this.frontLeftUpperLegMesh);
		
		this.frontLeftKneeBone = new THREE.Bone();
		this.frontLeftKneeBone.position.y = -0.8;
		this.frontLeftShoulderBone.add(this.frontLeftKneeBone);
		
		const frontLeftLowerLegGeometry = new THREE.BoxGeometry(0.15, 0.8, 0.15);
		const frontLeftLowerLegEdges = new THREE.EdgesGeometry(frontLeftLowerLegGeometry);
		this.frontLeftLowerLegMesh = new THREE.LineSegments(frontLeftLowerLegEdges, new THREE.LineBasicMaterial({ color: colorA, linewidth: 2 }));
		this.frontLeftLowerLegMesh.position.y = -0.4;
		this.frontLeftKneeBone.add(this.frontLeftLowerLegMesh);
		
		this.frontLeftFootBone = new THREE.Bone();
		this.frontLeftFootBone.position.y = -0.8;
		this.frontLeftKneeBone.add(this.frontLeftFootBone);
		
		const frontLeftFootGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.3);
		const frontLeftFootEdges = new THREE.EdgesGeometry(frontLeftFootGeometry);
		this.frontLeftFootMesh = new THREE.LineSegments(frontLeftFootEdges, new THREE.LineBasicMaterial({ color: colorB, linewidth: 2 }));
		this.frontLeftFootMesh.position.set(0, -0.05, 0.1);
		this.frontLeftFootBone.add(this.frontLeftFootMesh);

		// 前脚（右）
		this.frontRightShoulderBone = new THREE.Bone();
		this.frontRightShoulderBone.position.set(-0.8, -0.2, 0.8);
		this.bodyBone.add(this.frontRightShoulderBone);
		
		const frontRightUpperLegGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
		const frontRightUpperLegEdges = new THREE.EdgesGeometry(frontRightUpperLegGeometry);
		this.frontRightUpperLegMesh = new THREE.LineSegments(frontRightUpperLegEdges, new THREE.LineBasicMaterial({ color: colorB, linewidth: 2 }));
		this.frontRightUpperLegMesh.position.y = -0.4;
		this.frontRightShoulderBone.add(this.frontRightUpperLegMesh);
		
		this.frontRightKneeBone = new THREE.Bone();
		this.frontRightKneeBone.position.y = -0.8;
		this.frontRightShoulderBone.add(this.frontRightKneeBone);
		
		const frontRightLowerLegGeometry = new THREE.BoxGeometry(0.15, 0.8, 0.15);
		const frontRightLowerLegEdges = new THREE.EdgesGeometry(frontRightLowerLegGeometry);
		this.frontRightLowerLegMesh = new THREE.LineSegments(frontRightLowerLegEdges, new THREE.LineBasicMaterial({ color: colorA, linewidth: 2 }));
		this.frontRightLowerLegMesh.position.y = -0.4;
		this.frontRightKneeBone.add(this.frontRightLowerLegMesh);
		
		this.frontRightFootBone = new THREE.Bone();
		this.frontRightFootBone.position.y = -0.8;
		this.frontRightKneeBone.add(this.frontRightFootBone);
		
		const frontRightFootGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.3);
		const frontRightFootEdges = new THREE.EdgesGeometry(frontRightFootGeometry);
		this.frontRightFootMesh = new THREE.LineSegments(frontRightFootEdges, new THREE.LineBasicMaterial({ color: colorB, linewidth: 2 }));
		this.frontRightFootMesh.position.set(0, -0.05, 0.1);
		this.frontRightFootBone.add(this.frontRightFootMesh);

		// 後脚（左）
		this.backLeftHipBone = new THREE.Bone();
		this.backLeftHipBone.position.set(0.8, -0.2, -0.8);
		this.bodyBone.add(this.backLeftHipBone);
		
		const backLeftUpperLegGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
		const backLeftUpperLegEdges = new THREE.EdgesGeometry(backLeftUpperLegGeometry);
		this.backLeftUpperLegMesh = new THREE.LineSegments(backLeftUpperLegEdges, new THREE.LineBasicMaterial({ color: colorB, linewidth: 2 }));
		this.backLeftUpperLegMesh.position.y = -0.4;
		this.backLeftHipBone.add(this.backLeftUpperLegMesh);
		
		this.backLeftKneeBone = new THREE.Bone();
		this.backLeftKneeBone.position.y = -0.8;
		this.backLeftHipBone.add(this.backLeftKneeBone);
		
		const backLeftLowerLegGeometry = new THREE.BoxGeometry(0.15, 0.8, 0.15);
		const backLeftLowerLegEdges = new THREE.EdgesGeometry(backLeftLowerLegGeometry);
		this.backLeftLowerLegMesh = new THREE.LineSegments(backLeftLowerLegEdges, new THREE.LineBasicMaterial({ color: colorA, linewidth: 2 }));
		this.backLeftLowerLegMesh.position.y = -0.4;
		this.backLeftKneeBone.add(this.backLeftLowerLegMesh);
		
		this.backLeftFootBone = new THREE.Bone();
		this.backLeftFootBone.position.y = -0.8;
		this.backLeftKneeBone.add(this.backLeftFootBone);
		
		const backLeftFootGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.3);
		const backLeftFootEdges = new THREE.EdgesGeometry(backLeftFootGeometry);
		this.backLeftFootMesh = new THREE.LineSegments(backLeftFootEdges, new THREE.LineBasicMaterial({ color: colorB, linewidth: 2 }));
		this.backLeftFootMesh.position.set(0, -0.05, 0.1);
		this.backLeftFootBone.add(this.backLeftFootMesh);

		// 後脚（右）
		this.backRightHipBone = new THREE.Bone();
		this.backRightHipBone.position.set(-0.8, -0.2, -0.8);
		this.bodyBone.add(this.backRightHipBone);
		
		const backRightUpperLegGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
		const backRightUpperLegEdges = new THREE.EdgesGeometry(backRightUpperLegGeometry);
		this.backRightUpperLegMesh = new THREE.LineSegments(backRightUpperLegEdges, new THREE.LineBasicMaterial({ color: colorB, linewidth: 2 }));
		this.backRightUpperLegMesh.position.y = -0.4;
		this.backRightHipBone.add(this.backRightUpperLegMesh);
		
		this.backRightKneeBone = new THREE.Bone();
		this.backRightKneeBone.position.y = -0.8;
		this.backRightHipBone.add(this.backRightKneeBone);
		
		const backRightLowerLegGeometry = new THREE.BoxGeometry(0.15, 0.8, 0.15);
		const backRightLowerLegEdges = new THREE.EdgesGeometry(backRightLowerLegGeometry);
		this.backRightLowerLegMesh = new THREE.LineSegments(backRightLowerLegEdges, new THREE.LineBasicMaterial({ color: colorA, linewidth: 2 }));
		this.backRightLowerLegMesh.position.y = -0.4;
		this.backRightKneeBone.add(this.backRightLowerLegMesh);
		
		this.backRightFootBone = new THREE.Bone();
		this.backRightFootBone.position.y = -0.8;
		this.backRightKneeBone.add(this.backRightFootBone);
		
		const backRightFootGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.3);
		const backRightFootEdges = new THREE.EdgesGeometry(backRightFootGeometry);
		this.backRightFootMesh = new THREE.LineSegments(backRightFootEdges, new THREE.LineBasicMaterial({ color: colorB, linewidth: 2 }));
		this.backRightFootMesh.position.set(0, -0.05, 0.1);
		this.backRightFootBone.add(this.backRightFootMesh);

		// 尻尾ボーン（オプション）
		this.tailBone = new THREE.Bone();
		this.tailBone.position.set(0, 0.2, -1.2);
		this.bodyBone.add(this.tailBone);
		
		const tailGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.8);
		const tailEdges = new THREE.EdgesGeometry(tailGeometry);
		this.tailMesh = new THREE.LineSegments(tailEdges, new THREE.LineBasicMaterial({ color: colorA, linewidth: 2 }));
		this.tailMesh.position.y = 0;
		this.tailBone.add(this.tailMesh);

		// スケルトンの作成
		this.skeleton = new THREE.Skeleton([this.rootBone]);
		this.character.add(this.rootBone);

		// 初期位置の設定
		this.character.position.set(0, 0, 0);
	}

	updateLimbAnimation(deltaTime) {
		this.animationTime += deltaTime * this.animationSpeed;

		if (this.isFalling) {
			this.updateFallAnimation(deltaTime);
			return;
		}

		if (this.isJumping) {
			this.updateJumpAnimation(deltaTime);
			return;
		}

		if (this.isAttacking) {
			this.updateAttackAnimation(deltaTime);
			return;
		}

		if (this.isMoving) {
			// 4足歩行動物の歩行アニメーション
			// 胴体の上下動
			this.rootBone.position.y = 1.0 + Math.sin(this.animationTime * 2) * 0.1;
			this.rootBone.rotation.x = Math.sin(this.animationTime * 2) * 0.02;
			
			// 胴体の微妙な揺れ
			this.bodyBone.rotation.z = Math.sin(this.animationTime) * 0.05;
			this.bodyBone.rotation.x = Math.sin(this.animationTime * 2) * 0.02;
			
			// 前脚の動き（対角線の脚が同じタイミングで動く）
			// 前左脚と後右脚が同じタイミング
			this.frontLeftShoulderBone.rotation.x = Math.sin(this.animationTime) * this.legSwingAmplitude * 0.6;
			this.frontLeftKneeBone.rotation.x = -1.0 + Math.sin(this.animationTime - 0.3) * 0.2;
			this.frontLeftFootBone.rotation.x = Math.sin(this.animationTime - 0.6) * 0.3;
			
			// 前右脚と後左脚が同じタイミング（逆位相）
			this.frontRightShoulderBone.rotation.x = Math.sin(this.animationTime + Math.PI) * this.legSwingAmplitude * 0.6;
			this.frontRightKneeBone.rotation.x = -1.0 + Math.sin(this.animationTime + Math.PI - 0.3) * 0.2;
			this.frontRightFootBone.rotation.x = Math.sin(this.animationTime + Math.PI - 0.6) * 0.3;
			
			// 後脚の動き
			this.backLeftHipBone.rotation.x = Math.sin(this.animationTime + Math.PI) * this.legSwingAmplitude * 0.8;
			this.backLeftKneeBone.rotation.x = Math.max(0, Math.sin(this.animationTime + Math.PI - 0.4) * this.legSwingAmplitude * 0.8);
			this.backLeftFootBone.rotation.x = Math.sin(this.animationTime + Math.PI - 0.8) * 0.3;
			
			this.backRightHipBone.rotation.x = Math.sin(this.animationTime) * this.legSwingAmplitude * 0.8;
			this.backRightKneeBone.rotation.x = Math.max(0, Math.sin(this.animationTime - 0.4) * this.legSwingAmplitude * 0.8);
			this.backRightFootBone.rotation.x = Math.sin(this.animationTime - 0.8) * 0.3;
			
			// 尻尾の動き
			this.tailBone.rotation.y = Math.sin(this.animationTime * 0.8) * 0.3;
			this.tailBone.rotation.z = Math.sin(this.animationTime * 1.2) * 0.1;
			
			// 首と頭の自然な動き
			this.neckBone.rotation.y = Math.sin(this.animationTime * 0.5) * 0.1;
			this.neckBone.rotation.x = Math.sin(this.animationTime * 2) * 0.02;
			this.headBone.rotation.y = Math.sin(this.animationTime * 0.3) * 0.05;
			this.headBone.rotation.x = Math.sin(this.animationTime * 1.5) * 0.03;
		} else {
			// 静止時の姿勢
			this.rootBone.position.y = 1.0;
			this.rootBone.rotation.x = 0;
			this.bodyBone.rotation.set(0, 0, 0);
			
			// 脚を自然な姿勢に
			this.frontLeftShoulderBone.rotation.set(0, 0, 0);
			this.frontRightShoulderBone.rotation.set(0, 0, 0);
			this.frontLeftKneeBone.rotation.set(0, 0, 0);
			this.frontRightKneeBone.rotation.set(0, 0, 0);
			this.frontLeftFootBone.rotation.set(0, 0, 0);
			this.frontRightFootBone.rotation.set(0, 0, 0);
			
			this.backLeftHipBone.rotation.set(0, 0, 0);
			this.backRightHipBone.rotation.set(0, 0, 0);
			this.backLeftKneeBone.rotation.set(0, 0, 0);
			this.backRightKneeBone.rotation.set(0, 0, 0);
			this.backLeftFootBone.rotation.set(0, 0, 0);
			this.backRightFootBone.rotation.set(0, 0, 0);
			
			// 尻尾を自然な位置に
			this.tailBone.rotation.set(0, 0, 0);
			
			// 首と頭を自然な位置に
			this.neckBone.rotation.set(0, 0, 0);
			this.headBone.rotation.set(0, 0, 0);
		}
	}

	updateAttackAnimation(deltaTime) {
		this.attackTime += deltaTime;
		const progress = Math.min(this.attackTime / this.attackDuration, 1);
		
		// 4足歩行動物の攻撃アニメーション（前脚を使った攻撃）
		if (progress < 0.5) {
			// 攻撃準備：前脚を上げる
			const upProgress = progress * 2;
			const legAngle = upProgress * Math.PI / 3;
			this.frontLeftShoulderBone.rotation.x = -legAngle;
			this.frontRightShoulderBone.rotation.x = -legAngle;
			
			// 胴体を少し前傾
			this.bodyBone.rotation.x = upProgress * 0.2;
			
			// 頭を下げる
			this.headBone.rotation.x = upProgress * 0.3;
		} else {
			// 攻撃実行：前脚を振り下ろす
			const downProgress = (progress - 0.5) * 2;
			const legAngle = Math.PI / 3 - (downProgress * Math.PI / 3);
			this.frontLeftShoulderBone.rotation.x = -legAngle;
			this.frontRightShoulderBone.rotation.x = -legAngle;
			
			// 胴体を元に戻す
			this.bodyBone.rotation.x = 0.2 - (downProgress * 0.2);
			
			// 頭を元に戻す
			this.headBone.rotation.x = 0.3 - (downProgress * 0.3);
		}
		
		if (progress >= 1) {
			this.isAttacking = false;
			this.frontLeftShoulderBone.rotation.x = 0;
			this.frontRightShoulderBone.rotation.x = 0;
			this.bodyBone.rotation.x = 0;
			this.headBone.rotation.x = 0;
		}
	}

	updateJumpAnimation(deltaTime) {
		this.jumpTime += deltaTime;
		const progress = Math.min(this.jumpTime / this.jumpDuration, 1);
		
		// 4足歩行動物のジャンプアニメーション
		// ジャンプの高さ
		const jumpHeight = Math.sin(progress * Math.PI) * this.jumpHeight;
		this.rootBone.position.y = 1.0 + jumpHeight;
		
		// 4本の脚を曲げる（ジャンプ準備）
		const legBend = Math.sin(progress * Math.PI * 2) * 0.3;
		this.frontLeftKneeBone.rotation.x = legBend;
		this.frontRightKneeBone.rotation.x = legBend;
		this.backLeftKneeBone.rotation.x = legBend;
		this.backRightKneeBone.rotation.x = legBend;
		
		// 前脚を少し上げる（ジャンプ時の姿勢）
		const frontLegRaise = Math.min(progress * 2, 1) * Math.PI / 6;
		this.frontLeftShoulderBone.rotation.x = -frontLegRaise;
		this.frontRightShoulderBone.rotation.x = -frontLegRaise;
		
		// 尻尾を上げる（バランス調整）
		this.tailBone.rotation.x = Math.sin(progress * Math.PI) * 0.2;
		
		// 胴体を少し前傾
		this.bodyBone.rotation.x = Math.sin(progress * Math.PI) * 0.1;
		
		// ジャンプ終了時の処理
		if (progress >= 1) {
			this.isJumping = false;
			this.jumpTime = 0;
			// 元の姿勢に戻す
			this.frontLeftKneeBone.rotation.x = 0;
			this.frontRightKneeBone.rotation.x = 0;
			this.backLeftKneeBone.rotation.x = 0;
			this.backRightKneeBone.rotation.x = 0;
			this.frontLeftShoulderBone.rotation.x = 0;
			this.frontRightShoulderBone.rotation.x = 0;
			this.tailBone.rotation.x = 0;
			this.bodyBone.rotation.x = 0;
		}
	}

	updateFallAnimation(deltaTime) {
		this.fallTime += deltaTime;
		const progress = Math.min(this.fallTime / this.fallDuration, 1);
		
		// 4足歩行動物の倒れるアニメーション
		// 胴体を横に倒す
		this.bodyBone.rotation.z = progress * Math.PI / 2;
		
		// 4本の脚を折り曲げる
		const legBend = progress * Math.PI / 3;
		this.frontLeftShoulderBone.rotation.x = -legBend;
		this.frontRightShoulderBone.rotation.x = -legBend;
		this.frontLeftKneeBone.rotation.x = legBend;
		this.frontRightKneeBone.rotation.x = legBend;
		this.backLeftHipBone.rotation.x = -legBend;
		this.backRightHipBone.rotation.x = -legBend;
		this.backLeftKneeBone.rotation.x = legBend;
		this.backRightKneeBone.rotation.x = legBend;
		
		// 首を横に倒す
		this.neckBone.rotation.z = progress * Math.PI / 4;
		
		// 頭を下げる
		this.headBone.rotation.x = progress * Math.PI / 6;
		
		// 尻尾を下げる
		this.tailBone.rotation.x = -progress * Math.PI / 4;
		
		// 全体を少し下に下げる
		this.rootBone.position.y = 1.0 - (progress * 0.3);
	}

	startFall() {
		if (!this.isFalling && !this.isJumping && !this.isAttacking) {
			this.isFalling = true;
			this.fallTime = 0;
		}
	}

	stopFall() {
		this.isFalling = false;
		this.fallTime = 0;
		// 元の姿勢に戻す
		this.bodyBone.rotation.set(0, 0, 0);
		this.frontLeftShoulderBone.rotation.set(0, 0, 0);
		this.frontRightShoulderBone.rotation.set(0, 0, 0);
		this.frontLeftKneeBone.rotation.set(0, 0, 0);
		this.frontRightKneeBone.rotation.set(0, 0, 0);
		this.backLeftHipBone.rotation.set(0, 0, 0);
		this.backRightHipBone.rotation.set(0, 0, 0);
		this.backLeftKneeBone.rotation.set(0, 0, 0);
		this.backRightKneeBone.rotation.set(0, 0, 0);
		this.neckBone.rotation.set(0, 0, 0);
		this.headBone.rotation.set(0, 0, 0);
		this.tailBone.rotation.set(0, 0, 0);
		this.rootBone.position.y = 1.0;
	}

	startJump() {
		if (!this.isJumping && !this.isAttacking) {
			this.isJumping = true;
			this.jumpTime = 0;
		}
	}

	move(direction, speed, deltaTime) {
		if (direction.length() > 0) {
			direction.normalize();
		}

		const currentSpeed = speed;
		this.velocity.copy(direction).multiplyScalar(currentSpeed * deltaTime);
		this.velocity.applyEuler(this.rotation);
		this.position.add(this.velocity);
		this.character.position.copy(this.position);
		this.isMoving = direction.length() > 0;

		// this.gameがnullの場合の安全な処理
		if (this.game && this.game.fieldMap) {
			const height = this.game.fieldMap.getHeightAt(this.position.x, this.position.z);
			if (height != null) {
				this.position.y = height + 0.5;
			}
		} else {
			// gameがnullの場合は地形システムを使用
			const terrainHeight = getTerrainHeight(this.position.x, this.position.z);
			if (terrainHeight !== undefined) {
				this.position.y = terrainHeight + 1;
			}
		}
	}

	setPosition(x, y, z) {
		this.position.set(x, y, z);
		this.character.position.copy(this.position);
	}

	getPosition() {
		return this.position;
	}

	setRotation(y) {
		this.rotation.y = y;
		if (this.type === "player") {
			this.character.rotation.y = y + Math.PI; // プレイヤーの場合は180度回転を加える
		} else {
			this.character.rotation.y = y;
		}
	}

	getRotation() {
		return this.rotation;
	}

	setRunning(isRunning) {
		this.isRunning = isRunning;
		this.isMoving = isRunning;
		this.animationSpeed = isRunning ? 18.0 : 18.0; // 常に2倍の速度を維持
	}

	startAttack() {
		this.isAttacking = true;
		this.attackTime = 0;
	}

	stopAttack() {
		this.isAttacking = false;
		this.attackTime = 0;
	}

	setColor(color) {
		// 色を16進数に変換
		const hexColor = (typeof color === 'string') ? parseInt(color, 16) : color;
		
		// デバッグログ
		//console.log('Setting character color:', hexColor.toString(16));
		
		// 上半身のパーツ
		const upperBodyParts = [
			this.headMesh,
			this.bodyMesh,
			this.neckMesh,
			this.frontLeftUpperLegMesh,
			this.frontLeftLowerLegMesh,
			this.frontRightUpperLegMesh,
			this.frontRightLowerLegMesh,
			this.tailMesh
		];
		
		// 下半身のパーツ
		const lowerBodyParts = [
			this.backLeftUpperLegMesh,
			this.backLeftLowerLegMesh,
			this.backRightUpperLegMesh,
			this.backRightLowerLegMesh,
			this.frontLeftFootMesh,
			this.frontRightFootMesh,
			this.backLeftFootMesh,
			this.backRightFootMesh
		];

		// 色をRGBに分解
		const r = (hexColor >> 16) & 255;
		const g = (hexColor >> 8) & 255;
		const b = hexColor & 255;

		// 上半身用の色を作成（より明るく）
		const upperR = Math.min(255, Math.floor(r * 1.6));
		const upperG = Math.min(255, Math.floor(g * 1.6));
		const upperB = Math.min(255, Math.floor(b * 1.6));
		const upperColor = (upperR << 16) | (upperG << 8) | upperB;

		// 下半身用の色を作成（上半身より暗め）
		const lowerR = Math.min(255, Math.floor(r * 0.8));
		const lowerG = Math.min(255, Math.floor(g * 0.8));
		const lowerB = Math.min(255, Math.floor(b * 0.8));
		const lowerColor = (lowerR << 16) | (lowerG << 8) | lowerB;

		// 上半身のパーツに色を設定
		upperBodyParts.forEach(part => {
			if (part && part.material) {
				part.material = new THREE.MeshPhongMaterial({
					color: upperColor,
					shininess: 5,
					specular: upperColor,
					emissive: upperColor,
					emissiveIntensity: 0.6,
					side: THREE.DoubleSide
				});
				part.material.needsUpdate = true;
			}
		});

		// 下半身のパーツに色を設定
		lowerBodyParts.forEach(part => {
			if (part && part.material) {
				part.material = new THREE.MeshPhongMaterial({
					color: lowerColor,
					shininess: 5,
					specular: lowerColor,
					emissive: lowerColor,
					emissiveIntensity: 0.6,
					side: THREE.DoubleSide
				});
				part.material.needsUpdate = true;
			}
		});
	}

	dispose() {
		this.scene.remove(this.character);
		
		// メッシュとマテリアルの解放
		const meshes = [
			this.bodyMesh, this.neckMesh, this.headMesh, this.tailMesh,
			this.frontLeftUpperLegMesh, this.frontLeftLowerLegMesh, this.frontLeftFootMesh,
			this.frontRightUpperLegMesh, this.frontRightLowerLegMesh, this.frontRightFootMesh,
			this.backLeftUpperLegMesh, this.backLeftLowerLegMesh, this.backLeftFootMesh,
			this.backRightUpperLegMesh, this.backRightLowerLegMesh, this.backRightFootMesh
		];
		
		meshes.forEach(mesh => {
			if (mesh) {
				mesh.geometry.dispose();
				mesh.material.dispose();
			}
		});
	}
}