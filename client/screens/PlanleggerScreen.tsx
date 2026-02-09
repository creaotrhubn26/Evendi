import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '../components/ThemedText';
import { Button } from '../components/Button';
import { SwipeableRow } from '../components/SwipeableRow';
import { VendorSuggestions } from '../components/VendorSuggestions';
import { VendorActionBar } from '../components/VendorActionBar';
import { useTheme } from '../hooks/useTheme';
import { useVendorSearch } from '../hooks/useVendorSearch';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { PlanningStackParamList } from '../navigation/PlanningStackNavigator';

type TabType = 'meetings' | 'tasks' | 'timeline';
type NavigationProp = NativeStackNavigationProp<PlanningStackParamList>;

interface PlannerMeeting {
  id: string;
  plannerName: string;
  date: string;
  time?: string;
  location?: string;
  topic?: string;
  notes?: string;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface PlannerTask {
  id: string;
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  category?: string;
  notes?: string;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface PlannerTimeline {
  plannerSelected?: boolean;
  initialMeeting?: boolean;
  contractSigned?: boolean;
  depositPaid?: boolean;
  timelineCreated?: boolean;
}

const PRIORITY_COLORS = {
  high: '#DC2626',
  medium: '#F59E0B',
  low: '#10B981',
};

const PRIORITY_LABELS = {
  high: 'Høy',
  medium: 'Gjennomsnitt',
  low: 'Lav',
};

const TIMELINE_STEPS = [
  { key: 'plannerSelected', label: 'Planlegger valgt', icon: 'check-circle' as const },
  { key: 'initialMeeting', label: 'Første møte gjennomført', icon: 'users' as const },
  { key: 'contractSigned', label: 'Kontrakt signert', icon: 'file-text' as const },
  { key: 'depositPaid', label: 'Depositum betalt', icon: 'credit-card' as const },
  { key: 'timelineCreated', label: 'Tidslinje opprettet', icon: 'calendar' as const },
];

const TASK_CATEGORIES = [
  'Møter',
  'Dokumenter',
  'Betalinger',
  'Leverandører',
  'Gjester',
  'Design',
  'Annet',
];

export function PlanleggerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('meetings');
  const [refreshing, setRefreshing] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<PlannerMeeting | null>(null);
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);

  // Vendor search for planner autocomplete
  const plannerSearch = useVendorSearch({ category: 'planner' });

  // Form state - Meetings
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingTopic, setMeetingTopic] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');

  // Form state - Tasks
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [taskCategory, setTaskCategory] = useState('');
  const [taskNotes, setTaskNotes] = useState('');

  // Mock data
  const [meetings, setMeetings] = useState<PlannerMeeting[]>([]);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [timeline, setTimeline] = useState<PlannerTimeline>({});

  useFocusEffect(
    useCallback(() => {
      // Load data when screen is focused
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Meeting handlers
  const openMeetingModal = (meeting?: PlannerMeeting) => {
    if (meeting) {
      setEditingMeeting(meeting);
      plannerSearch.setSearchText(meeting.plannerName);
      plannerSearch.setSelectedVendor(null);
      setMeetingDate(meeting.date);
      setMeetingTime(meeting.time || '');
      setMeetingLocation(meeting.location || '');
      setMeetingTopic(meeting.topic || '');
      setMeetingNotes(meeting.notes || '');
    } else {
      setEditingMeeting(null);
      plannerSearch.clearSelection();
      setMeetingDate('');
      setMeetingTime('');
      setMeetingLocation('');
      setMeetingTopic('');
      setMeetingNotes('');
    }
    setShowMeetingModal(true);
  };

  const saveMeeting = async () => {
    if (!plannerSearch.searchText.trim() || !meetingDate.trim()) {
      Alert.alert('Feil', 'Vennligst fyll inn planleggernavn og dato');
      return;
    }

    const meeting: PlannerMeeting = {
      id: editingMeeting?.id || Date.now().toString(),
      plannerName: plannerSearch.searchText.trim(),
      date: meetingDate,
      time: meetingTime,
      location: meetingLocation,
      topic: meetingTopic,
      notes: meetingNotes,
      completed: editingMeeting?.completed || false,
    };

    if (editingMeeting) {
      setMeetings(meetings.map(m => m.id === editingMeeting.id ? meeting : m));
    } else {
      setMeetings([...meetings, meeting]);
    }

    setShowMeetingModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const deleteMeeting = (id: string) => {
    Alert.alert('Slett møte', 'Er du sikker på at du vil slette dette møtet?', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Slett',
        style: 'destructive',
        onPress: () => {
          setMeetings(meetings.filter(m => m.id !== id));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const duplicateMeeting = async (meeting: PlannerMeeting) => {
    try {
      const newMeeting: PlannerMeeting = {
        ...meeting,
        id: Date.now().toString(),
        plannerName: `Kopi av ${meeting.plannerName}`,
        completed: false,
      };
      setMeetings([...meetings, newMeeting]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Feil', 'Kunne ikke duplisere møte');
    }
  };

  const toggleMeetingComplete = (id: string) => {
    setMeetings(meetings.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Task handlers
  const openTaskModal = (task?: PlannerTask) => {
    if (task) {
      setEditingTask(task);
      setTaskTitle(task.title);
      setTaskDueDate(task.dueDate);
      setTaskPriority(task.priority);
      setTaskCategory(task.category || '');
      setTaskNotes(task.notes || '');
    } else {
      setEditingTask(null);
      setTaskTitle('');
      setTaskDueDate('');
      setTaskPriority('medium');
      setTaskCategory('');
      setTaskNotes('');
    }
    setShowTaskModal(true);
  };

  const saveTask = async () => {
    if (!taskTitle.trim() || !taskDueDate.trim()) {
      Alert.alert('Feil', 'Vennligst fyll inn oppgavenavn og forfallsdato');
      return;
    }

    const task: PlannerTask = {
      id: editingTask?.id || Date.now().toString(),
      title: taskTitle,
      dueDate: taskDueDate,
      priority: taskPriority,
      category: taskCategory,
      notes: taskNotes,
      completed: editingTask?.completed || false,
    };

    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? task : t));
    } else {
      setTasks([...tasks, task]);
    }

    setShowTaskModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const deleteTask = (id: string) => {
    Alert.alert('Slett oppgave', 'Er du sikker på at du vil slette denne oppgaven?', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Slett',
        style: 'destructive',
        onPress: () => {
          setTasks(tasks.filter(t => t.id !== id));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const duplicateTask = async (task: PlannerTask) => {
    try {
      const newTask: PlannerTask = {
        ...task,
        id: Date.now().toString(),
        title: `Kopi av ${task.title}`,
        completed: false,
      };
      setTasks([...tasks, newTask]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Feil', 'Kunne ikke duplisere oppgave');
    }
  };

  const toggleTaskComplete = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleFindPlanner = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('VendorMatching', { category: 'planner' });
  };

  const renderMeetingsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Møter med planlegger</ThemedText>
        <Pressable onPress={() => openMeetingModal()} style={[styles.addButton, { backgroundColor: theme.primary }]}>
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {meetings.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="users" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Ingen møter planlagt ennå
          </ThemedText>
          <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
            Planlegg møter med bryllupsplanleggeren
          </ThemedText>
          <Button onPress={() => openMeetingModal()} style={styles.buttonSmall}>
            Legg til møte
          </Button>
        </View>
      ) : (
        meetings.map((meeting, index) => (
          <Animated.View key={meeting.id} entering={FadeInDown.delay(index * 50)}>
            <SwipeableRow onDelete={() => deleteMeeting(meeting.id)}>
              <Pressable
                onPress={() => openMeetingModal(meeting)}
                onLongPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert('Alternativer', meeting.plannerName, [
                    { text: 'Avbryt', style: 'cancel' },
                    { text: 'Rediger', onPress: () => openMeetingModal(meeting) },
                    { text: 'Dupliser', onPress: () => duplicateMeeting(meeting) },
                    { text: 'Slett', style: 'destructive', onPress: () => deleteMeeting(meeting.id) },
                  ]);
                }}
                style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
              >
                <Pressable
                  onPress={() => toggleMeetingComplete(meeting.id)}
                  style={[
                    styles.checkbox,
                    { borderColor: theme.border },
                    meeting.completed && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                >
                  {meeting.completed && <Feather name="check" size={14} color="#fff" />}
                </Pressable>
                <View style={styles.cardInfo}>
                  <ThemedText style={[styles.cardTitle, meeting.completed && styles.completedText]}>
                    {meeting.plannerName}
                  </ThemedText>
                  <ThemedText style={[styles.cardDate, { color: theme.textSecondary }]}>
                    {meeting.date} {meeting.time && `kl. ${meeting.time}`}
                  </ThemedText>
                  {meeting.topic && (
                    <ThemedText style={[styles.cardTopic, { color: theme.textSecondary }]}>
                      Tema: {meeting.topic}
                    </ThemedText>
                  )}
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    duplicateMeeting(meeting);
                  }}
                  style={styles.quickActionButton}
                >
                  <Feather name="copy" size={16} color={theme.textSecondary} />
                </Pressable>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </Pressable>
            </SwipeableRow>
          </Animated.View>
        ))
      )}
    </View>
  );

  const renderTasksTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Oppgaver</ThemedText>
        <Pressable onPress={() => openTaskModal()} style={[styles.addButton, { backgroundColor: theme.primary }]}>
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {tasks.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="check-square" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Ingen oppgaver ennå
          </ThemedText>
          <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
            Opprett oppgaver for å holde styr på planleggingen
          </ThemedText>
          <Button onPress={() => openTaskModal()} style={styles.buttonSmall}>
            Legg til oppgave
          </Button>
        </View>
      ) : (
        tasks.map((task, index) => (
          <Animated.View key={task.id} entering={FadeInDown.delay(index * 50)}>
            <SwipeableRow onDelete={() => deleteTask(task.id)}>
              <Pressable
                onPress={() => openTaskModal(task)}
                onLongPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert('Alternativer', task.title, [
                    { text: 'Avbryt', style: 'cancel' },
                    { text: 'Rediger', onPress: () => openTaskModal(task) },
                    { text: 'Dupliser', onPress: () => duplicateTask(task) },
                    { text: 'Slett', style: 'destructive', onPress: () => deleteTask(task.id) },
                  ]);
                }}
                style={[styles.card, { backgroundColor: theme.backgroundDefault }]}
              >
                <Pressable
                  onPress={() => toggleTaskComplete(task.id)}
                  style={[
                    styles.checkbox,
                    { borderColor: theme.border },
                    task.completed && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                >
                  {task.completed && <Feather name="check" size={14} color="#fff" />}
                </Pressable>
                <View style={styles.cardInfo}>
                  <ThemedText style={[styles.cardTitle, task.completed && styles.completedText]}>
                    {task.title}
                  </ThemedText>
                  <View style={styles.taskMeta}>
                    <ThemedText style={[styles.cardDate, { color: theme.textSecondary }]}>
                      {task.dueDate}
                    </ThemedText>
                    <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[task.priority] }]}>
                      <ThemedText style={styles.priorityText}>{PRIORITY_LABELS[task.priority]}</ThemedText>
                    </View>
                    {task.category && (
                      <ThemedText style={[styles.categoryLabel, { color: theme.textSecondary }]}>
                        {task.category}
                      </ThemedText>
                    )}
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    duplicateTask(task);
                  }}
                  style={styles.quickActionButton}
                >
                  <Feather name="copy" size={16} color={theme.textSecondary} />
                </Pressable>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </Pressable>
            </SwipeableRow>
          </Animated.View>
        ))
      )}
    </View>
  );

  const renderTimelineTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Planleggingstidslinje</ThemedText>
      </View>

      <View style={[styles.timelineCard, { backgroundColor: theme.backgroundDefault }]}>
        {TIMELINE_STEPS.map((step) => (
          <Pressable
            key={step.key}
            onPress={() => {
              setTimeline({
                ...timeline,
                [step.key]: !timeline[step.key as keyof PlannerTimeline],
              });
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={styles.timelineStep}
          >
            <View
              style={[
                styles.timelineCheckbox,
                { borderColor: theme.border },
                timeline[step.key as keyof PlannerTimeline] && { backgroundColor: Colors.light.success, borderColor: Colors.light.success },
              ]}
            >
              {timeline[step.key as keyof PlannerTimeline] && <Feather name="check" size={12} color="#fff" />}
            </View>
            <View style={styles.timelineStepContent}>
              <Feather name={step.icon} size={16} color={theme.textSecondary} />
              <ThemedText style={[styles.timelineLabel, { color: theme.text }]}>
                {step.label}
              </ThemedText>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]} edges={['bottom']}>
      <View style={[styles.header, { backgroundColor: theme.backgroundDefault, borderBottomColor: theme.border }]}>
        <View style={styles.headerContent}>
          <View style={[styles.iconCircle, { backgroundColor: Colors.dark.accent + '15' }]}>
            <Feather name="clipboard" size={24} color={Colors.dark.accent} />
          </View>
          <View style={styles.headerText}>
            <ThemedText style={styles.headerTitle}>Bryllupsplanlegger</ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: theme.textMuted }]}>
              Planlegging og koordinering
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={[styles.tabBar, { backgroundColor: theme.backgroundDefault, borderBottomColor: theme.border }]}>
        {['meetings', 'tasks', 'timeline'].map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => {
              setActiveTab(tab as TabType);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <ThemedText style={[styles.tabText, activeTab === tab && { color: Colors.dark.accent }]}>
              {tab === 'meetings' ? 'Møter' : tab === 'tasks' ? 'Oppgaver' : 'Tidslinje'}
            </ThemedText>
            {activeTab === tab && <View style={[styles.tabIndicator, { backgroundColor: Colors.dark.accent }]} />}
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'meetings' && renderMeetingsTab()}
        {activeTab === 'tasks' && renderTasksTab()}
        {activeTab === 'timeline' && renderTimelineTab()}
      </ScrollView>

      {/* Meeting Modal */}
      <Modal visible={showMeetingModal} animationType="slide" onRequestClose={() => setShowMeetingModal(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.backgroundDefault, borderBottomColor: theme.border }]}>
            <Pressable onPress={() => setShowMeetingModal(false)}>
              <ThemedText style={[styles.modalCancel, { color: theme.primary }]}>Avbryt</ThemedText>
            </Pressable>
            <ThemedText style={styles.modalTitle}>
              {editingMeeting ? 'Rediger møte' : 'Legg til møte'}
            </ThemedText>
            <Pressable onPress={saveMeeting}>
              <ThemedText style={[styles.modalSave, { color: theme.primary }]}>Lagre</ThemedText>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Planleggernavn *</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                placeholder="Søk etter registrert planlegger..."
                placeholderTextColor={theme.textSecondary}
                value={plannerSearch.searchText}
                onChangeText={plannerSearch.onChangeText}
              />
              {plannerSearch.selectedVendor && (
                <VendorActionBar
                  vendor={plannerSearch.selectedVendor}
                  vendorCategory="planner"
                  onClear={plannerSearch.clearSelection}
                  icon="clipboard"
                />
              )}
              <VendorSuggestions
                suggestions={plannerSearch.suggestions}
                isLoading={plannerSearch.isLoading}
                onSelect={plannerSearch.onSelectVendor}
                onViewProfile={(v) => navigation.navigate('VendorDetail', {
                  vendorId: v.id,
                  vendorName: v.businessName,
                  vendorDescription: v.description || '',
                  vendorLocation: v.location || '',
                  vendorPriceRange: v.priceRange || '',
                  vendorCategory: 'planner',
                })}
                icon="clipboard"
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Dato *</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                placeholder="DD.MM.YYYY"
                placeholderTextColor={theme.textSecondary}
                value={meetingDate}
                onChangeText={setMeetingDate}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <ThemedText style={styles.formLabel}>Tid</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  placeholder="HH:MM"
                  placeholderTextColor={theme.textSecondary}
                  value={meetingTime}
                  onChangeText={setMeetingTime}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: Spacing.md }]}>
                <ThemedText style={styles.formLabel}>Sted</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  placeholder="f.eks. Kontor"
                  placeholderTextColor={theme.textSecondary}
                  value={meetingLocation}
                  onChangeText={setMeetingLocation}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Tema</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                placeholder="f.eks. Budsjett og gjester"
                placeholderTextColor={theme.textSecondary}
                value={meetingTopic}
                onChangeText={setMeetingTopic}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Notater</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text, minHeight: 80 }]}
                placeholder="Møtenotater..."
                placeholderTextColor={theme.textSecondary}
                value={meetingNotes}
                onChangeText={setMeetingNotes}
                multiline
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Task Modal */}
      <Modal visible={showTaskModal} animationType="slide" onRequestClose={() => setShowTaskModal(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.backgroundDefault, borderBottomColor: theme.border }]}>
            <Pressable onPress={() => setShowTaskModal(false)}>
              <ThemedText style={[styles.modalCancel, { color: theme.primary }]}>Avbryt</ThemedText>
            </Pressable>
            <ThemedText style={styles.modalTitle}>
              {editingTask ? 'Rediger oppgave' : 'Legg til oppgave'}
            </ThemedText>
            <Pressable onPress={saveTask}>
              <ThemedText style={[styles.modalSave, { color: theme.primary }]}>Lagre</ThemedText>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Oppgavenavn *</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                placeholder="f.eks. Bestille musikk"
                placeholderTextColor={theme.textSecondary}
                value={taskTitle}
                onChangeText={setTaskTitle}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Forfallsdato *</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                placeholder="DD.MM.YYYY"
                placeholderTextColor={theme.textSecondary}
                value={taskDueDate}
                onChangeText={setTaskDueDate}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Prioritet</ThemedText>
              <View style={styles.priorityGroup}>
                {(['high', 'medium', 'low'] as const).map((priority) => (
                  <Pressable
                    key={priority}
                    onPress={() => setTaskPriority(priority)}
                    style={[
                      styles.priorityOption,
                      taskPriority === priority && { backgroundColor: PRIORITY_COLORS[priority] + '30' },
                    ]}
                  >
                    <ThemedText style={styles.priorityOptionText}>{PRIORITY_LABELS[priority]}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Kategori</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {TASK_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setTaskCategory(taskCategory === cat ? '' : cat)}
                    style={[
                      styles.categoryChip,
                      taskCategory === cat && { backgroundColor: Colors.light.success },
                    ]}
                  >
                    <ThemedText style={styles.categoryChipText}>{cat}</ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Notater</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text, minHeight: 80 }]}
                placeholder="Oppgavedetaljer..."
                placeholderTextColor={theme.textSecondary}
                value={taskNotes}
                onChangeText={setTaskNotes}
                multiline
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerSubtitle: { fontSize: 14, marginTop: 2 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {},
  tabText: { fontSize: 15, fontWeight: '600' },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  content: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: Spacing.lg },
  tabContent: { gap: Spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyText: { fontSize: 16, fontWeight: '600' },
  emptySubtext: { fontSize: 13 },
  buttonSmall: { marginTop: Spacing.md },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  cardDate: { fontSize: 12 },
  cardTopic: { fontSize: 12, marginTop: 2 },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  quickActionButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  categoryLabel: {
    fontSize: 11,
  },
  timelineCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  timelineCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineStepContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  timelineLabel: { fontSize: 14, fontWeight: '500' },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  modalCancel: { fontSize: 16 },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  modalSave: { fontSize: 16, fontWeight: '600' },
  modalContent: { flex: 1, padding: Spacing.lg },
  formGroup: { marginBottom: Spacing.lg },
  formLabel: { fontSize: 14, fontWeight: '500', marginBottom: Spacing.sm },
  formRow: { flexDirection: 'row' },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
  },
  priorityGroup: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  priorityOptionText: { fontSize: 13, fontWeight: '500' },
  categoryScroll: { marginRight: -Spacing.lg },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  categoryChipText: { fontSize: 12, fontWeight: '500' },
});
