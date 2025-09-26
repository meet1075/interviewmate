// Debug script to test mock interview API
const fetch = require('node-fetch');

async function testMockInterviewSubmission() {
  try {
    console.log('Testing mock interview submission...');
    
    // First, let's test if we can create a session
    const createResponse = await fetch('http://localhost:3000/api/mockinterview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain: 'JavaScript',
        difficulty: 'Beginner'
      })
    });
    
    console.log('Create session status:', createResponse.status);
    
    if (createResponse.status === 201) {
      const sessionData = await createResponse.json();
      console.log('Session created:', sessionData.sessionId);
      
      // Now test submitting an answer
      const submitResponse = await fetch(`http://localhost:3000/api/mockinterview/${sessionData.sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: sessionData.questions[0].id,
          answer: 'This is a test answer',
          timeSpent: 60
        })
      });
      
      console.log('Submit answer status:', submitResponse.status);
      
      if (submitResponse.status !== 200) {
        const errorText = await submitResponse.text();
        console.log('Error response:', errorText);
      } else {
        const result = await submitResponse.json();
        console.log('Success:', result);
      }
    } else {
      const errorText = await createResponse.text();
      console.log('Create session error:', errorText);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testMockInterviewSubmission();