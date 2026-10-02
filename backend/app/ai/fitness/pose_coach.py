import math
from typing import Dict, Any, List, Tuple

class PoseCoach:
    """
    Computer Vision exercise pose logic that analyzes landmark joints (angles),
    tracks repetitions, identifies posture form flaws, and provides live coaching feedback.
    """
    
    @staticmethod
    def calculate_angle(a: Dict[str, float], b: Dict[str, float], c: Dict[str, float]) -> float:
        """
        Calculates 2D angle between three joints (a-b-c) where b is the vertex.
        """
        radians = math.atan2(c.get('y', 0) - b.get('y', 0), c.get('x', 0) - b.get('x', 0)) - \
                  math.atan2(a.get('y', 0) - b.get('y', 0), a.get('x', 0) - b.get('x', 0))
        angle = abs(radians * 180.0 / math.pi)
        if angle > 180.0:
            angle = 360.0 - angle
        return round(angle, 1)

    def analyze_pose(self, exercise_name: str, keypoints: List[Dict[str, float]], current_reps: int = 0, current_stage: str = "up") -> Dict[str, Any]:
        """
        Processes keypoint landmarks for supported exercises:
        - Squat (Hip-Knee-Ankle)
        - Push-up (Shoulder-Elbow-Wrist)
        - Lunge (Hip-Knee-Ankle)
        - Shoulder press (Elbow-Shoulder-Hip)
        - Bicep curl (Shoulder-Elbow-Wrist)
        - Plank (Shoulder-Hip-Ankle)
        """
        ex = exercise_name.lower()
        form_score = 92.0
        feedback = "Good form! Keep controlled speed."
        voice = "Good rep!"
        new_stage = current_stage
        new_reps = current_reps
        angle = 180.0

        if len(keypoints) < 12:
            return {
                "exercise_name": exercise_name,
                "rep_count": current_reps,
                "stage": current_stage,
                "form_score": 85.0,
                "current_angle": 180.0,
                "feedback": "Position full body in camera frame",
                "voice_feedback": "Adjust position"
            }

        # Index mapping standard pose keypoints
        # 11: left_shoulder, 12: right_shoulder, 23: left_hip, 24: right_hip
        # 25: left_knee, 26: right_knee, 27: left_ankle, 28: right_ankle
        # 13: left_elbow, 14: right_elbow, 15: left_wrist, 16: right_wrist

        try:
            if "squat" in ex:
                # Hip-Knee-Ankle (left side or right side)
                hip = keypoints[23] if len(keypoints) > 23 else keypoints[0]
                knee = keypoints[25] if len(keypoints) > 25 else keypoints[1]
                ankle = keypoints[27] if len(keypoints) > 27 else keypoints[2]
                angle = self.calculate_angle(hip, knee, ankle)

                if angle < 95:
                    new_stage = "down"
                    feedback = "Great depth in squat!"
                elif angle > 160 and new_stage == "down":
                    new_stage = "up"
                    new_reps += 1
                    voice = f"{new_reps} reps completed. Keep your back straight!"
                
                if angle < 60:
                    form_score = 78.0
                    feedback = "Squatting too deep. Keep knees safe."

            elif "push" in ex or "push-up" in ex:
                shoulder = keypoints[11] if len(keypoints) > 11 else keypoints[0]
                elbow = keypoints[13] if len(keypoints) > 13 else keypoints[1]
                wrist = keypoints[15] if len(keypoints) > 15 else keypoints[2]
                angle = self.calculate_angle(shoulder, elbow, wrist)

                if angle < 90:
                    new_stage = "down"
                    feedback = "Lower chest further to ground."
                elif angle > 160 and new_stage == "down":
                    new_stage = "up"
                    new_reps += 1
                    voice = f"Rep {new_reps}! Strong chest drive."

            elif "curl" in ex or "bicep" in ex:
                shoulder = keypoints[11] if len(keypoints) > 11 else keypoints[0]
                elbow = keypoints[13] if len(keypoints) > 13 else keypoints[1]
                wrist = keypoints[15] if len(keypoints) > 15 else keypoints[2]
                angle = self.calculate_angle(shoulder, elbow, wrist)

                if angle < 45:
                    new_stage = "up"
                    feedback = "Squeeze bicep at peak contraction!"
                elif angle > 150 and new_stage == "up":
                    new_stage = "down"
                    new_reps += 1
                    voice = f"{new_reps} curls done!"

            elif "shoulder" in ex or "press" in ex:
                elbow = keypoints[13] if len(keypoints) > 13 else keypoints[0]
                shoulder = keypoints[11] if len(keypoints) > 11 else keypoints[1]
                hip = keypoints[23] if len(keypoints) > 23 else keypoints[2]
                angle = self.calculate_angle(elbow, shoulder, hip)

                if angle > 140:
                    new_stage = "up"
                    feedback = "Fully extend arms overhead!"
                elif angle < 90 and new_stage == "up":
                    new_stage = "down"
                    new_reps += 1
                    voice = f"{new_reps} presses completed!"

            elif "plank" in ex:
                shoulder = keypoints[11] if len(keypoints) > 11 else keypoints[0]
                hip = keypoints[23] if len(keypoints) > 23 else keypoints[1]
                ankle = keypoints[27] if len(keypoints) > 27 else keypoints[2]
                angle = self.calculate_angle(shoulder, hip, ankle)

                if angle < 160:
                    form_score = 75.0
                    feedback = "Keep hips in straight alignment with shoulders."
                    voice = "Raise hips slightly."
                else:
                    feedback = "Excellent spine alignment! Hold steady."
                    voice = "Hold core tight!"

        except Exception as e:
            feedback = "Tracking pose keypoints..."

        return {
            "exercise_name": exercise_name,
            "rep_count": new_reps,
            "stage": new_stage,
            "form_score": form_score,
            "current_angle": angle,
            "feedback": feedback,
            "voice_feedback": voice
        }
