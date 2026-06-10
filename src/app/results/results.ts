import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ElementRef, ViewChildrenDecorator, QueryList } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../services/supabase';
import {Chart, registerables} from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-results',
  imports: [CommonModule, RouterLink],
  templateUrl: './results.html',
  styleUrl: './results.css',
})
export class Results implements OnInit {
  questionnaire: any = null; //stores questionnaire data or null if not loaded
  questions: any[] = []; //store questions
  submissions: any[] = []; //stores user submissions
  isLoading = true; //tracks loading state
  totalSubmissions = 0;
  radioCount = 0;
  dropdownCount = 0;
  textCount = 0;
  latestSubmissionDate = '';
  chartQuestions: any[] = []; //stores radio and dropdown questions with their statistics

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  //runs automatically and immediately when the Results page opens
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id'); //read the questionnaire ID from the URL
    if (id) {
      this.loadResults(id); //If ID exists, fetch all results for that questionnaire
    }
  }

  async loadResults(id: string) {
    try {
      // 1. Fetch the questionnaire
      const { data: qData, error: qError } = await this.supabase.supabase
        .from('questionnaires')
        .select('*')
        .eq('id', id)
        .single();

      if (qError) throw qError;
      this.questionnaire = qData;

      // 2. Fetch questions
      const { data: qsData, error: qsError } = await this.supabase.supabase
        .from('questions')
        .select('*')
        .eq('questionnaire_id', id)
        .order('page_number', { ascending: true })
        .order('order_index', { ascending: true });

      if (qsError) throw qsError;
      this.questions = qsData || [];

      // 3. Fetch submissions
      const { data: subData, error: subError } = await this.supabase.supabase
        .from('submissions')
        .select('*')
        .eq('questionnaire_id', id);

      if (subError) throw subError;

      // 4. Fetch answers for each submission separately

      const submissionsWithAnswers = await Promise.all( //Promise.all means that fetch them all then deliver them at once, not one by one
          (subData || []).map(async (sub) => {
            /* 
            This function says for each submission, go and fetch its answers
            */

            //Go get all answers linked to this submission ID
       const { data: ansData, error: ansError } = await this.supabase.supabase
           .from('answers')
             .select('question_id, answer_value')
               .eq('submission_id', sub.id);
               

          const answerMap: any = {}; //creates an empty object to store answers in a way that we can easily access them by question ID

          //Converts array → object for easier lookup
          (ansData || []).forEach((ans: any) => {
            answerMap[ans.question_id] = ans.answer_value;
          });

          return {
            id: sub.id,
            submitted_at: sub.submitted_at,
            answers: answerMap
          };
        })
      );

      //Data integrity: Makes sure that it shows submissions where the number of answers matches the number of questions. 
      // This is to prevent showing incomplete submissions that might have been started but not finished.
      this.submissions = submissionsWithAnswers.filter(sub =>
        this.questions.every(q => sub.answers[q.id] !== undefined)
      );

      //NEW: Run calculation process for the sidebar quick stats
      this.calculateQuickStats();
      
      this.isLoading = false;
      this.cdr.detectChanges();

      //Initialize charts after view updates
      setTimeout(() => this.initCharts(), 100);

    } catch (error: any) {
      console.error("Results Load Error:", JSON.stringify(error)); //JSON turns a JavaScript object into a text/string format.
      // so it converts the error object into readable text for debugging
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  // NEW: Helper logic method to loop metrics values
  calculateQuickStats() {
    this.totalSubmissions = this.submissions.length;
    this.radioCount = this.questions.filter(q => q.type === 'radio').length;
    this.dropdownCount = this.questions.filter(q => q.type === 'dropdown').length;
    this.textCount = this.questions.filter(q => q.type === 'text').length;

    if (this.submissions.length > 0) {
      // Find the absolute newest timestamp out of all complete submissions
      const sorted = [...this.submissions].sort((a, b) => {
        return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
      });
      
      // Format cleanly using South African localized defaults (DD MMM YYYY)
      const latestDate = new Date(sorted[0].submitted_at);
      this.latestSubmissionDate = latestDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } else {
      this.latestSubmissionDate = '—';
    }

    //Build chart data for radio and dropdown questions only
    this.chartQuestions = this.questions
    .filter(q => q.type === 'radio' || q.type === 'dropdown')
    .map(q => 
    {
       const allAnswers = this.submissions.map(sub => sub.answers[q.id] || '');
       const counts: { [key: string]: number } = {};
       allAnswers.forEach(answer => 
       {
         if (answer) counts[answer] = (counts[answer] || 0) + 1;
       });

       return {
       id: q.id,
       label: q.label,
       type: q.type,
       labels: Object.keys(counts),
       data: Object.values(counts),
       total: allAnswers.filter(a => a !== '').length
       };
    });
  }
     initCharts() 
      {
     this.chartQuestions.forEach(q => {
     const canvas = document.getElementById(`chart-${q.id}`) as HTMLCanvasElement;
     if (!canvas) return;

     //Destro existing chart if any
     const existing = Chart.getChart(canvas);
     if (existing) existing.destroy();

     const colors = q.type === 'radio'
     ? ['#8b5cf6', '#c4b5fd', '#ddd6fe', '#ede9fe']
        : ['#3b82f6', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff'];

        new Chart(canvas, {
           type: q.type === 'radio' ? 'doughnut' : 'bar',
           data: {
           labels: q.labels,
           datasets: [{
               data: q.data,
               backgroundColor: colors.slice(0, q.labels.length),
               borderWidth: 0,
               borderRadius: q.type === 'dropdown' ? 4 : 0
               }]
     },
     options: {
         responsive: true,
         plugins: {
         legend: {
         position: q.type === 'radio' ? 'bottom' : 'none' as any,
         labels: { font: {size: 11}, padding: 8}
         },
         tooltip: {
         callbacks: {
         label: (context) => {
         const value = context.raw as number;
         const percentage = Math.round((value / q.total) * 100);
         return ` ${value} responses (${percentage}%) `;
      }
    }
  }
},
  scales: q.type === 'bar' ? {
  y: {
  beginAtZero: true,
  ticks: {stepSize: 1}
  }
  } : {}
  }
  });
  });
  }


  async clearResults() {
    const confirmed = confirm(`Are you sure you want to delete ALL submissions for "${this.questionnaire.title}"? This cannot be undone.`);
    if (!confirmed) return;

    const { error } = await this.supabase.supabase
      .from('submissions')
      .delete()
      .eq('questionnaire_id', this.questionnaire.id);

    if (error) {
      alert("Failed to clear results: " + error.message);
      return;
    }

    alert("All results cleared successfully.");
    this.submissions = [];
    this.cdr.detectChanges();
  }

  exportCSV() {
    if (this.submissions.length === 0) //checks if we actually have any submissions
       {
      alert("No data to export.");
      return;
    }

    const headers = ['Submission Date', ...this.questions.map(q => q.label)]; //creates the top row (column names) for the CSV file

    const rows = this.submissions.map(sub => { //loops through every submission and creates one CSV row per submission
      const date = new Date(sub.submitted_at).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' }); //gives time of submission
      const answers = this.questions.map(q => { //for each question, get the corresponding answer from the submission
        const val = sub.answers[q.id] || ''; //"get this question's answer"
        return `"=""${val}"""`; //Forces Excel to treat the value as text
      });
      return [date, ...answers].join(';'); //creates one CSV line
    });

    const csvContent = [headers.join(';'), ...rows].join('\n'); //combines headers, all rows into one big CSV string
    const blob = new Blob([csvContent], { type: 'text/csv' }); //turns the text into a downloadable file object
    const url = window.URL.createObjectURL(blob); //creates a temporary browser link so that we'll be able to download the CSV file
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.questionnaire.title}_results.csv`;
    a.click();
    window.URL.revokeObjectURL(url); //removes the temporary URL to free up memory  
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}