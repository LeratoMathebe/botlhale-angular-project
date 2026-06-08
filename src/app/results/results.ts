import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../services/supabase';

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
      
      this.isLoading = false;
      this.cdr.detectChanges();

    } catch (error: any) {
      console.error("Results Load Error:", JSON.stringify(error)); //JSON turns a JavaScript object into a text/string format.
      // so it converts the error object into readable text for debugging
      this.isLoading = false;
      this.cdr.detectChanges();
    }
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