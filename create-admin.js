// Script to create an admin user
import fetch from 'node-fetch';

async function createAdminUser() {
  try {
    // Define the admin user data
    const adminData = {
      username: 'Admin',
      password: '123456',
      confirmPassword: '123456',
      email: 'admin@example.com',
      fullName: 'System Administrator',
      role: 'admin'
    };

    // Register the new admin user
    const registerResponse = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(adminData)
    });

    const registerData = await registerResponse.json();
    
    console.log('Registration response:', registerData);
    
    if (registerResponse.ok) {
      console.log('Admin user created successfully!');
    } else {
      console.error('Failed to create admin user:', registerData.message);
    }
  } catch (error) {
    console.error('Error creating admin user:', error.message);
  }
}

// Execute the function
createAdminUser(); 