export interface User {
  id: string;
  name: string;
  email: string;
  program: string;
  yearOfStudy: number;
  role: 'student' | 'admin';
  avatar?: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  courseCode: string;
  courseName: string;
  description: string;
  meetingLocation: string;
  faculty: string;
  leaderId: string;
  leaderName: string;
  members: string[];
  memberCount: number;
  createdAt: string;
}

export interface StudySession {
  id: string;
  groupId: string;
  groupName: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

export interface GroupPost {
  id: string;
  groupId: string;
  authorName: string;
  content: string;
  createdAt: string;
  type: 'announcement' | 'question' | 'general';
}

export const mockCurrentUser: User = {
  id: 'u1',
  name: 'John Mukasa',
  email: 'john.mukasa@ucu.ac.ug',
  program: 'BSc Information Technology',
  yearOfStudy: 2,
  role: 'student',
};

export const mockGroups: StudyGroup[] = [
  {
    id: 'g1', name: 'Data Structures Masters', courseCode: 'CSC1201',
    courseName: 'Data Structures & Algorithms', description: 'Weekly practice on arrays, trees, and graph problems.',
    meetingLocation: 'Library Room 204', faculty: 'Engineering, Design & Technology',
    leaderId: 'u1', leaderName: 'John Mukasa', members: ['u1', 'u2', 'u3', 'u4'], memberCount: 4, createdAt: '2026-03-15',
  },
  {
    id: 'g2', name: 'Web Dev Study Circle', courseCode: 'CSC1202',
    courseName: 'Web & Mobile App Development', description: 'Building full-stack projects together using React and Node.js.',
    meetingLocation: 'Online - Google Meet', faculty: 'Engineering, Design & Technology',
    leaderId: 'u2', leaderName: 'Grace Nakato', members: ['u1', 'u2', 'u5'], memberCount: 3, createdAt: '2026-03-20',
  },
  {
    id: 'g3', name: 'Database Design Crew', courseCode: 'CSC1203',
    courseName: 'Database Management Systems', description: 'ER diagrams, normalization, and SQL practice sessions.',
    meetingLocation: 'Computer Lab 3', faculty: 'Engineering, Design & Technology',
    leaderId: 'u3', leaderName: 'Peter Ochieng', members: ['u3', 'u4', 'u5', 'u6', 'u7'], memberCount: 5, createdAt: '2026-03-10',
  },
  {
    id: 'g4', name: 'Calculus Study Group', courseCode: 'MAT1101',
    courseName: 'Calculus I', description: 'Working through calculus problems and exam prep.',
    meetingLocation: 'Science Block Room 105', faculty: 'Science',
    leaderId: 'u4', leaderName: 'Sarah Achieng', members: ['u4', 'u6'], memberCount: 2, createdAt: '2026-04-01',
  },
  {
    id: 'g5', name: 'Networking Enthusiasts', courseCode: 'CSC1205',
    courseName: 'Computer Networks', description: 'Hands-on practice with networking concepts and Cisco packet tracer.',
    meetingLocation: 'Online - Zoom', faculty: 'Engineering, Design & Technology',
    leaderId: 'u5', leaderName: 'David Kamau', members: ['u2', 'u5', 'u6', 'u7', 'u1'], memberCount: 5, createdAt: '2026-03-25',
  },
];

export const mockSessions: StudySession[] = [
  { id: 's1', groupId: 'g1', groupName: 'Data Structures Masters', date: '2026-04-14', time: '10:00 AM', location: 'Library Room 204', description: 'Binary trees and traversal algorithms' },
  { id: 's2', groupId: 'g2', groupName: 'Web Dev Study Circle', date: '2026-04-15', time: '2:00 PM', location: 'Online - Google Meet', description: 'React hooks deep dive' },
  { id: 's3', groupId: 'g1', groupName: 'Data Structures Masters', date: '2026-04-17', time: '10:00 AM', location: 'Library Room 204', description: 'Graph algorithms - BFS and DFS' },
  { id: 's4', groupId: 'g5', groupName: 'Networking Enthusiasts', date: '2026-04-16', time: '4:00 PM', location: 'Online - Zoom', description: 'TCP/IP protocol suite review' },
];

export const mockPosts: GroupPost[] = [
  { id: 'p1', groupId: 'g1', authorName: 'John Mukasa', content: 'Reminder: bring your laptops for the coding practice session tomorrow!', createdAt: '2026-04-12T10:30:00', type: 'announcement' },
  { id: 'p2', groupId: 'g1', authorName: 'Grace Nakato', content: 'Can someone explain the difference between BFS and DFS?', createdAt: '2026-04-12T14:15:00', type: 'question' },
  { id: 'p3', groupId: 'g2', authorName: 'Peter Ochieng', content: 'Found a great tutorial on React Router v6. Sharing the link in our next session.', createdAt: '2026-04-11T09:00:00', type: 'general' },
  { id: 'p4', groupId: 'g1', authorName: 'Sarah Achieng', content: 'I created a shared Google Doc with notes from last session. Check your email!', createdAt: '2026-04-11T16:45:00', type: 'announcement' },
];
