# End-to-End Testing Guide

Follow these steps to verify the complete functionality of your Hostel Management System.

## 1. Authentication & Onboarding
- [ ] **Sign Up**: Go to `/login` and create a new account.
- [ ] **Profile**: You should be redirected to the dashboard. Go to Profile and set a username.

## 2. Space Management (Multi-Tenant)
- [ ] **Create Space**: Go to Spaces -> Create Space. Name it "Test Flat".
- [ ] **Invite Code**: Copy the invite code shown on the space detail page.
- [ ] **Join Space**: Open an incognito window, sign up as a second user ("Roommate"), and use the invite code to join "Test Flat".

## 3. Task Creation
- [ ] **Create Task**: As User 1, go to Tasks -> Create Task.
- [ ] **Details**: Create a "Clean Kitchen" task.
  - Category: Kitchen
  - Difficulty: 7 (Hard)
  - Due Date: Tomorrow
- [ ] **Verify**: Check that the task appears in the "Available" tab for both users.

## 4. Intelligent Task Picking
- [ ] **Recommendations**: As User 2, go to "Pick Task".
- [ ] **Fairness Check**: The system should recommend the task. Since User 2 has 0 points, they should be encouraged to take it.
- [ ] **Take Task**: Click "Take Task".
- [ ] **Status Update**: Task should move to "My Tasks" for User 2 and show as "In Progress" for User 1.

## 5. Execution & Proof
- [ ] **Upload Proof**: As User 2, open the task details. Click "Upload Proof Photo" and select an image.
- [ ] **Status Change**: Task status should change to "Pending Verification".

## 6. Verification & Gamification
- [ ] **Verify**: As User 1, open the task. You should see the photo and "Approve/Reject" buttons.
- [ ] **Approve**: Click "Approve".
- [ ] **Celebration**: User 1 should see a success message.
- [ ] **Points**: Go to Leaderboard. User 2 should now have 7 points.

## 7. Preferences & Fairness
- [ ] **Set Preferences**: As User 1, go to Profile -> Preferences. Mark "Kitchen" as "Avoid".
- [ ] **Create Another Task**: Create another Kitchen task.
- [ ] **Check Recommendations**: Go to "Pick Task". The Kitchen task should have a lower score/recommendation for User 1 because of the preference.

## 8. Mobile Responsiveness
- [ ] **Resize Window**: Shrink your browser to mobile size.
- [ ] **Navigation**: Verify the bottom navigation bar appears and works correctly.
