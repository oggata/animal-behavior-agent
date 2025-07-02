// シマウマ用の縞模様テクスチャを生成
function createZebraTexture() {
	const size = 128;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d');
	// 白背景
	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, size, size);
	// 黒い縞
	ctx.strokeStyle = '#000';
	ctx.lineWidth = 16;
	for (let i = 0; i < 6; i++) {
		ctx.beginPath();
		ctx.moveTo(i * 24, 0);
		ctx.lineTo(i * 16 + 32, size);
		ctx.stroke();
	}
	const texture = new THREE.CanvasTexture(canvas);
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(2, 1);
	return texture;
}

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
		this.animationSpeed=0.4; // アニメーション速度を遅くして自然な歩行に
		this.walkAmplitude = 0.3;
		this.legSwingAmplitude = 0.4;

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
		// テクスチャ・色の共通処理
		let mainMaterial, subMaterial;
		if (this.type === 'animal' && this.game && this.game.animalType === 'シマウマ') {
			const zebraTexture = createZebraTexture();
			mainMaterial = new THREE.MeshStandardMaterial({ map: zebraTexture });
			subMaterial = new THREE.MeshStandardMaterial({ map: zebraTexture });
		} else {
			mainMaterial = new THREE.MeshStandardMaterial({ color: this.color || 0xffffff });
			subMaterial = new THREE.MeshStandardMaterial({ color: this.color || 0xffffff });
		}

		// 動物の種類に応じたサイズ調整
		let bodyWidth = 1.5, bodyHeight = 0.8, bodyLength = 2.5;
		let neckLength = 0.6, neckWidth = 0.4, neckHeight = 0.4;
		let headWidth = 0.6, headHeight = 0.5, headLength = 0.8;
		let legWidth = 0.2, legHeight = 0.8, legLength = 0.2;
		let footWidth = 0.2, footHeight = 0.1, footLength = 0.3;
		let tailLength = 0.8;

		// 動物の種類に応じた形状調整
		if (this.type === 'animal' && this.game) {
			switch (this.game.animalType) {
				case 'キリン':
					// キリン：首をさらに長く、体を少し大きく
					bodyWidth = 1.2; bodyHeight = 1.0; bodyLength = 2.8;
					neckLength = 2.2; neckWidth = 0.25; neckHeight = 0.25;
					headWidth = 0.4; headHeight = 0.5; headLength = 0.8;
					legWidth = 0.25; legHeight = 1.4; legLength = 0.25;
					footWidth = 0.25; footHeight = 0.15; footLength = 0.4;
					tailLength = 1.0;
					break;
				case 'ゾウ':
					// ゾウ：体を大きく、脚を太く、鼻を長く
					bodyWidth = 2.2; bodyHeight = 1.3; bodyLength = 3.2;
					neckLength = 0.3; neckWidth = 0.7; neckHeight = 0.6;
					headWidth = 0.9; headHeight = 0.8; headLength = 1.2;
					legWidth = 0.45; legHeight = 1.1; legLength = 0.45;
					footWidth = 0.45; footHeight = 0.25; footLength = 0.6;
					tailLength = 0.6;
					break;
				case 'シマウマ':
					// シマウマ：体をさらに細く、脚を長く
					bodyWidth = 0.8; bodyHeight = 0.6; bodyLength = 2.0;
					neckLength = 0.6; neckWidth = 0.25; neckHeight = 0.25;
					headWidth = 0.35; headHeight = 0.35; headLength = 0.6;
					legWidth = 0.12; legHeight = 1.0; legLength = 0.12;
					footWidth = 0.12; footHeight = 0.06; footLength = 0.2;
					tailLength = 0.8;
					break;
				case 'ライオン':
					// ライオン：筋肉質な体
					bodyWidth = 1.4; bodyHeight = 0.9; bodyLength = 2.6;
					neckLength = 0.5; neckWidth = 0.4; neckHeight = 0.4;
					headWidth = 0.6; headHeight = 0.5; headLength = 0.8;
					legWidth = 0.2; legHeight = 0.8; legLength = 0.2;
					footWidth = 0.2; footHeight = 0.1; footLength = 0.3;
					tailLength = 0.9;
					break;
				case 'ハイエナ':
					// ハイエナ：少し小さめで筋肉質
					bodyWidth = 1.1; bodyHeight = 0.7; bodyLength = 2.0;
					neckLength = 0.4; neckWidth = 0.3; neckHeight = 0.3;
					headWidth = 0.5; headHeight = 0.4; headLength = 0.7;
					legWidth = 0.18; legHeight = 0.7; legLength = 0.18;
					footWidth = 0.18; footHeight = 0.08; footLength = 0.25;
					tailLength = 0.6;
					break;
				case 'ミーアキャット':
					// ミーアキャット：小さくて細長い
					bodyWidth = 0.4; bodyHeight = 0.3; bodyLength = 1.2;
					neckLength = 0.2; neckWidth = 0.15; neckHeight = 0.15;
					headWidth = 0.2; headHeight = 0.15; headLength = 0.3;
					legWidth = 0.08; legHeight = 0.4; legLength = 0.08;
					footWidth = 0.08; footHeight = 0.04; footLength = 0.12;
					tailLength = 0.8;
					break;
				case 'トムソンガゼル':
					// トムソンガゼル：小さくて細長い
					bodyWidth = 0.5; bodyHeight = 0.4; bodyLength = 1.4;
					neckLength = 0.3; neckWidth = 0.2; neckHeight = 0.2;
					headWidth = 0.25; headHeight = 0.2; headLength = 0.4;
					legWidth = 0.1; legHeight = 0.6; legLength = 0.1;
					footWidth = 0.1; footHeight = 0.05; footLength = 0.15;
					tailLength = 0.4;
					break;
			}
		}

		// ルートボーン（胴体の中心）
		this.rootBone = new THREE.Bone();
		// キリンの場合は全体の高さを上げる
		if (this.type === 'animal' && this.game && this.game.animalType === 'キリン') {
			this.rootBone.position.y = 1.8;
		} else {
			this.rootBone.position.y = 1.0;
		}

		// 胴体ボーン
		this.bodyBone = new THREE.Bone();
		this.bodyBone.position.y = 0;
		this.rootBone.add(this.bodyBone);

		// 胴体メッシュ
		const bodyGeometry = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyLength);
		this.bodyMesh = new THREE.Mesh(bodyGeometry, mainMaterial);
		this.bodyMesh.position.y = 0;
		this.bodyBone.add(this.bodyMesh);

		// 首ボーン
		this.neckBone = new THREE.Bone();
		// キリンの場合は首の位置を高くする
		if (this.type === 'animal' && this.game && this.game.animalType === 'キリン') {
			this.neckBone.position.set(0, 0.6, bodyLength * 0.5);
		} else {
			this.neckBone.position.set(0, 0.4, bodyLength * 0.5);
		}
		this.bodyBone.add(this.neckBone);

		// 首メッシュ
		const neckGeometry = new THREE.BoxGeometry(neckWidth, neckHeight, neckLength);
		this.neckMesh = new THREE.Mesh(neckGeometry, mainMaterial);
		this.neckMesh.position.y = 0;
		this.neckBone.add(this.neckMesh);

		// 頭ボーン
		this.headBone = new THREE.Bone();
		this.headBone.position.set(0, 0, neckLength * 0.5);
		this.neckBone.add(this.headBone);

		// 頭メッシュ
		const headGeometry = new THREE.BoxGeometry(headWidth, headHeight, headLength);
		this.headMesh = new THREE.Mesh(headGeometry, mainMaterial);
		this.headMesh.position.y = 0;
		this.headBone.add(this.headMesh);

		// ゾウの鼻を追加
		if (this.type === 'animal' && this.game && this.game.animalType === 'ゾウ') {
			this.trunkBone = new THREE.Bone();
			this.trunkBone.position.set(0, -0.3, headLength * 0.5);
			this.headBone.add(this.trunkBone);
			
			// より長く、曲がった鼻を作成
			const trunkGeometry = new THREE.CylinderGeometry(0.08, 0.12, 1.8, 8);
			this.trunkMesh = new THREE.Mesh(trunkGeometry, mainMaterial);
			this.trunkMesh.position.y = 0;
			this.trunkMesh.rotation.x = Math.PI / 2;
			this.trunkMesh.rotation.z = Math.PI / 6; // 少し曲げる
			this.trunkBone.add(this.trunkMesh);
		}

		// 前脚（左）
		this.frontLeftShoulderBone = new THREE.Bone();
		this.frontLeftShoulderBone.position.set(bodyWidth * 0.5, -0.2, bodyLength * 0.3);
		this.bodyBone.add(this.frontLeftShoulderBone);
		
		const frontLeftUpperLegGeometry = new THREE.BoxGeometry(legWidth, legHeight, legLength);
		this.frontLeftUpperLegMesh = new THREE.Mesh(frontLeftUpperLegGeometry, subMaterial);
		this.frontLeftUpperLegMesh.position.y = -legHeight * 0.5;
		this.frontLeftShoulderBone.add(this.frontLeftUpperLegMesh);
		
		this.frontLeftKneeBone = new THREE.Bone();
		this.frontLeftKneeBone.position.y = -legHeight;
		this.frontLeftShoulderBone.add(this.frontLeftKneeBone);
		
		const frontLeftLowerLegGeometry = new THREE.BoxGeometry(legWidth * 0.75, legHeight, legLength * 0.75);
		this.frontLeftLowerLegMesh = new THREE.Mesh(frontLeftLowerLegGeometry, mainMaterial);
		this.frontLeftLowerLegMesh.position.y = -legHeight * 0.5;
		this.frontLeftKneeBone.add(this.frontLeftLowerLegMesh);
		
		this.frontLeftFootBone = new THREE.Bone();
		this.frontLeftFootBone.position.y = -legHeight;
		this.frontLeftKneeBone.add(this.frontLeftFootBone);
		
		const frontLeftFootGeometry = new THREE.BoxGeometry(footWidth, footHeight, footLength);
		this.frontLeftFootMesh = new THREE.Mesh(frontLeftFootGeometry, subMaterial);
		this.frontLeftFootMesh.position.set(0, -footHeight * 0.5, footLength * 0.3);
		this.frontLeftFootBone.add(this.frontLeftFootMesh);

		// 前脚（右）
		this.frontRightShoulderBone = new THREE.Bone();
		this.frontRightShoulderBone.position.set(-bodyWidth * 0.5, -0.2, bodyLength * 0.3);
		this.bodyBone.add(this.frontRightShoulderBone);
		
		const frontRightUpperLegGeometry = new THREE.BoxGeometry(legWidth, legHeight, legLength);
		this.frontRightUpperLegMesh = new THREE.Mesh(frontRightUpperLegGeometry, subMaterial);
		this.frontRightUpperLegMesh.position.y = -legHeight * 0.5;
		this.frontRightShoulderBone.add(this.frontRightUpperLegMesh);
		
		this.frontRightKneeBone = new THREE.Bone();
		this.frontRightKneeBone.position.y = -legHeight;
		this.frontRightShoulderBone.add(this.frontRightKneeBone);
		
		const frontRightLowerLegGeometry = new THREE.BoxGeometry(legWidth * 0.75, legHeight, legLength * 0.75);
		this.frontRightLowerLegMesh = new THREE.Mesh(frontRightLowerLegGeometry, mainMaterial);
		this.frontRightLowerLegMesh.position.y = -legHeight * 0.5;
		this.frontRightKneeBone.add(this.frontRightLowerLegMesh);
		
		this.frontRightFootBone = new THREE.Bone();
		this.frontRightFootBone.position.y = -legHeight;
		this.frontRightKneeBone.add(this.frontRightFootBone);
		
		const frontRightFootGeometry = new THREE.BoxGeometry(footWidth, footHeight, footLength);
		this.frontRightFootMesh = new THREE.Mesh(frontRightFootGeometry, subMaterial);
		this.frontRightFootMesh.position.set(0, -footHeight * 0.5, footLength * 0.3);
		this.frontRightFootBone.add(this.frontRightFootMesh);

		// 後脚（左）
		this.backLeftHipBone = new THREE.Bone();
		this.backLeftHipBone.position.set(bodyWidth * 0.5, -0.2, -bodyLength * 0.3);
		this.bodyBone.add(this.backLeftHipBone);
		
		const backLeftUpperLegGeometry = new THREE.BoxGeometry(legWidth, legHeight, legLength);
		this.backLeftUpperLegMesh = new THREE.Mesh(backLeftUpperLegGeometry, subMaterial);
		this.backLeftUpperLegMesh.position.y = -legHeight * 0.5;
		this.backLeftHipBone.add(this.backLeftUpperLegMesh);
		
		this.backLeftKneeBone = new THREE.Bone();
		this.backLeftKneeBone.position.y = -legHeight;
		this.backLeftHipBone.add(this.backLeftKneeBone);
		
		const backLeftLowerLegGeometry = new THREE.BoxGeometry(legWidth * 0.75, legHeight, legLength * 0.75);
		this.backLeftLowerLegMesh = new THREE.Mesh(backLeftLowerLegGeometry, mainMaterial);
		this.backLeftLowerLegMesh.position.y = -legHeight * 0.5;
		this.backLeftKneeBone.add(this.backLeftLowerLegMesh);
		
		this.backLeftFootBone = new THREE.Bone();
		this.backLeftFootBone.position.y = -legHeight;
		this.backLeftKneeBone.add(this.backLeftFootBone);
		
		const backLeftFootGeometry = new THREE.BoxGeometry(footWidth, footHeight, footLength);
		this.backLeftFootMesh = new THREE.Mesh(backLeftFootGeometry, subMaterial);
		this.backLeftFootMesh.position.set(0, -footHeight * 0.5, footLength * 0.3);
		this.backLeftFootBone.add(this.backLeftFootMesh);

		// 後脚（右）
		this.backRightHipBone = new THREE.Bone();
		this.backRightHipBone.position.set(-bodyWidth * 0.5, -0.2, -bodyLength * 0.3);
		this.bodyBone.add(this.backRightHipBone);
		
		const backRightUpperLegGeometry = new THREE.BoxGeometry(legWidth, legHeight, legLength);
		this.backRightUpperLegMesh = new THREE.Mesh(backRightUpperLegGeometry, subMaterial);
		this.backRightUpperLegMesh.position.y = -legHeight * 0.5;
		this.backRightHipBone.add(this.backRightUpperLegMesh);
		
		this.backRightKneeBone = new THREE.Bone();
		this.backRightKneeBone.position.y = -legHeight;
		this.backRightHipBone.add(this.backRightKneeBone);
		
		const backRightLowerLegGeometry = new THREE.BoxGeometry(legWidth * 0.75, legHeight, legLength * 0.75);
		this.backRightLowerLegMesh = new THREE.Mesh(backRightLowerLegGeometry, mainMaterial);
		this.backRightLowerLegMesh.position.y = -legHeight * 0.5;
		this.backRightKneeBone.add(this.backRightLowerLegMesh);
		
		this.backRightFootBone = new THREE.Bone();
		this.backRightFootBone.position.y = -legHeight;
		this.backRightKneeBone.add(this.backRightFootBone);
		
		const backRightFootGeometry = new THREE.BoxGeometry(footWidth, footHeight, footLength);
		this.backRightFootMesh = new THREE.Mesh(backRightFootGeometry, subMaterial);
		this.backRightFootMesh.position.set(0, -footHeight * 0.5, footLength * 0.3);
		this.backRightFootBone.add(this.backRightFootMesh);

		// 尻尾ボーン
		this.tailBone = new THREE.Bone();
		this.tailBone.position.set(0, 0.2, -bodyLength * 0.5);
		this.bodyBone.add(this.tailBone);
		
		const tailGeometry = new THREE.BoxGeometry(0.2, 0.2, tailLength);
		this.tailMesh = new THREE.Mesh(tailGeometry, mainMaterial);
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

		// 移動中はアニメーション速度を適切に設定
		if (this.isMoving && !this.isRunning) {
			// 動物の種類に応じたアニメーション速度を設定
			let baseSpeed = 0.4; // 基本速度
			
			if (this.type === 'animal' && this.game && this.game.animalType) {
				switch (this.game.animalType) {
					case 'ゾウ':
						baseSpeed = 0.2; // ゾウはゆっくり
						break;
					case 'キリン':
						baseSpeed = 0.3; // キリンは少しゆっくり
						break;
					case 'シマウマ':
						baseSpeed = 0.6; // シマウマは少し速め
						break;
									case 'ハイエナ':
					baseSpeed = 0.7; // ハイエナは速め
					break;
				case 'ミーアキャット':
					baseSpeed = 0.8; // ミーアキャットは速い
					break;
				case 'トムソンガゼル':
					baseSpeed = 0.9; // トムソンガゼルは最も速い
					break;
				case 'ライオン':
					baseSpeed = 0.5; // ライオンは中程度
					break;
				default:
					baseSpeed = 0.4;
				}
			}
			this.animationSpeed = baseSpeed;
		}

		// アニメーション時間の更新
		this.animationTime += deltaTime * this.animationSpeed;
		
		// アニメーションの更新
		this.updateLimbAnimation(deltaTime);

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

	// アニメーション更新メソッド
	update(deltaTime) {
		// 移動していない場合はアニメーション速度を遅くする
		if (!this.isMoving && !this.isRunning) {
			this.animationSpeed = 0.1; // 静止時は非常にゆっくり
		}
		
		// アニメーション時間の更新
		this.animationTime += deltaTime * this.animationSpeed;
		
		// 各種アニメーションの更新
		if (this.isAttacking) {
			this.updateAttackAnimation(deltaTime);
		} else if (this.isJumping) {
			this.updateJumpAnimation(deltaTime);
		} else if (this.isFalling) {
			this.updateFallAnimation(deltaTime);
		} else {
			this.updateLimbAnimation(deltaTime);
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
		
		// 動物の種類に応じたアニメーション速度を設定
		let baseSpeed = 0.4; // 基本速度
		
		if (this.type === 'animal' && this.game && this.game.animalType) {
			switch (this.game.animalType) {
				case 'ゾウ':
					baseSpeed = 0.2; // ゾウはゆっくり
					break;
				case 'キリン':
					baseSpeed = 0.3; // キリンは少しゆっくり
					break;
				case 'シマウマ':
					baseSpeed = 0.6; // シマウマは少し速め
					break;
				case 'ハイエナ':
					baseSpeed = 0.7; // ハイエナは速め
					break;
				case 'ミーアキャット':
					baseSpeed = 0.8; // ミーアキャットは速い
					break;
				case 'トムソンガゼル':
					baseSpeed = 0.9; // トムソンガゼルは最も速い
					break;
				case 'ライオン':
					baseSpeed = 0.5; // ライオンは中程度
					break;
				default:
					baseSpeed = 0.4;
			}
		}
		
		// 走っている場合は1.5倍の速度
		this.animationSpeed = isRunning ? baseSpeed * 1.5 : baseSpeed;
	}

	stopMoving() {
		this.isMoving = false;
		this.isRunning = false;
		this.velocity.set(0, 0, 0);
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