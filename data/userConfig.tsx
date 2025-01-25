export const profileConfig = {

  // If you want custom src set this to true and change linkedinProfilePic
  linkedinProfilePic: false,

    github: {
      username: "lightyfr", // Replace with your GitHub username
      email: "adhi.naddi@gmail.com",

      overideAutoStats: false, // Set to true to manually enter your total commits and stars below
      
      // These stats also show when api fails
      totalCommits: 642, // Replace with your total commits count
      totalStars: 1, // Replace with your total stars count
      yearsOfExperience: 2,
      totalProjects: 9, // Replace with your years of experience
    },

    linkedin: {
      profileURL: "https://www.linkedin.com/in/adhitya-nadooli-8b83782b4/",
      // If you want custom src also set this and change linkedinProfilePic to true
      profilePicSRC: "https://media.licdn.com/dms/image/v2/D4E03AQEMJk1Ntd1D9A/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1725826765996?e=1743033600&v=beta&t=wFpumK3DxHS9mpxRbxsLV7pTQlXlSHEk5o2Xc5e-fwc"
    }
  } as const