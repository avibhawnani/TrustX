'use strict';

const ethers = require('ethers');
const { formatEther, formatUnits, UnicodeNormalizationForm, ParamType } = require('ethers/lib/utils');

/**
 * test-collection controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

/**
 * getWeb3UserInit() will initalize the singer object using given params. Internal function, as API call
 * @param {*} localUser Boolean variable, True if localuser going to be used, else False
 * @param {*} user If localUser is false, then user details should be passed
 * @returns {*} signed user object
 */
const getWeb3UserInit = async(user_privatekey) => {
  const provider = new ethers.providers.AlchemyProvider(process.env.NETWORK, process.env.ALCHEMY_KEY);    // Define an Alchemy Provider

  const signer = new ethers.Wallet(user_privatekey, provider);  // Creating a wallet with the user's private key and provider

  return signer;
};

/**
 * Connect to the given contract address to do the blockchain transactions. Internal funcion, not as a API call
 * @param {*} userDet is user-details object with privatekey, if privatekey is not provided, default user's privatekey will be used
 * @param {*} _contractAddress address of the contract deployed to the network
 * @returns contract object
 */
const connectToContract = async (user, _contractAddress) => {
  try {
    
    if (_contractAddress == undefined)
      return null;

    const contract = await getWeb3UserInit(user).then((signer) => {
      const contract = require(process.env.CONTRACT_ABI);  //Getting compiled solidity's ABI file as a JSON
      const abi = contract.abi;                            // Get contract ABI
      return new ethers.Contract(_contractAddress, abi, signer);   // Create a contract instance
    });
    return contract;
  }
  catch (err) {
    console.log(err);
    return null;
  }
};

module.exports = createCoreController('api::test-collection.test-collection', ({ strapi }) => ({
    async exampleAction(ctx) {
      try {
        console.log("inside example Action");
        ctx.body = "hello world";
      } catch (err) {
        ctx.body = "=== error: " + err;
      }
    },

    /**
     * After singned-in the user, getting balance of the user from their ethereum wallet
     * @param {*} ctx Context-request, with user.privatekey to get wallet balance
     * @returns user balance from the ethereum wallet
     */
    async getBalance(ctx) {
      try {
        if (ctx.request.body.privatekey == undefined) {
          return {};
        }

        let returnable = {};

        await getWeb3UserInit(ctx.request.body.privatekey).then((signer) => {
          signer.getBalance().then(data => {
            returnable.balance = formatUnits(data, 'ether');
          });
        });
      } 
      catch (err) {
        returnable.error = err;
      }
    },

    /**
     * Adding the new entity like author, user, reviewer or publisher
     * @param {*} ctx Context-request, will contains user's privatekey, address of entity, name and type of entity
     * @returns the status of process
     */
    async addEntity(ctx) {

      if (ctx.request.body.privatekey == undefined) {
        return {
          status: false,
          error: "privatekey is mandatory"
        };
      }

      if (ctx.request.body.address == undefined) {
        return {
          status: false,
          error: "address is mandatory"
        };
      }

      if (ctx.request.body.name == undefined) {
        return {
          status: false,
          error: "name is mandatory"
        };
      }

      if (ctx.request.body.entity == undefined) {
        return {
          status: false,
          error: "entity-type is mandatory"
        };
      }
      
      let returnable = {};
      
      await connectToContract(ctx.request.body.privatekey, process.env.CONTRACT_ADDRESS)      // Connecting to contract
        .then(async (contract) => {
          
          try {
            switch(ctx.request.body.entity.toLowerCase()) {
              case "user":
                await contract.addUser(ctx.request.body.address, ctx.request.body.name);
                returnable.status = true;
                break;
              case "reviewer":
                await contract.addReviewer(ctx.request.body.address, ctx.request.body.name);
                returnable.status = true;
                break;
              case "publisher":
                await contract.addPublisher(ctx.request.body.address, ctx.request.body.name);
                returnable.status = true;
                break;
              case "author":
                if (ctx.request.body.mail == undefined) {
                  return {
                    status: false,
                    error: "author mail id is mandatory"
                  };
                }
                let contact = "";
                if (ctx.request.body.contact != undefined) {
                  contact = ctx.request.body.contact;
                }
                await contract.addAuthor(ctx.request.body.address, ctx.request.body.name, ctx.request.body.mail, contact);
                returnable.status = true;
                break;
              default:
                return {
                  status: false,
                  error: "not a valid entity"
                };
            }
          }
          catch (err) {
            return {status: false};
          }
          
          
        });
      return returnable;
    },
    
    // publisher_home
    /**
     * Getting the content for publisher landing page
     * @param {*} ctx Context-request, for user's privatekey, user address and isPublished flag
     * @returns the status
     */
    async publisher_home(ctx) {

      if (ctx.request.body.privatekey == undefined) {
        return {"error": "privatekey is mandatory"};
      }

      if (ctx.request.body.address == undefined) {
        return {"error": "address is mandatory"};
      }

      if (ctx.request.body.isPublished == undefined) {
        return {"error": "isPublished flag is mandatory"};
      }
    
      let returnable = {};
      
      await connectToContract(ctx.request.body.privatekey, process.env.CONTRACT_ADDRESS)      // Connecting to contract
        .then(async (contract) => {
          
          try {
            let papers = await contract.getPapers(ctx.request.body.address, ctx.request.body.isPublished);
            returnable.papers = [];
            //foreach will not work for await functionality
            for(let i=0;i<papers.length;i++) {
              let element = papers[i];
              let paperid = parseInt(element._hex, 16);
              // let paper = await contract.readPaper(paperid, true);
              let paper = await contract.papers(paperid);
              let retPaper = {
                id: paperid,
                title: paper.title,
                authors: "0x5BDDC6FA86A760e66E97EB95A34ABABAB61C651c",
                year: 2023,
                papertype: paper.category,
                url: "https://gateway.pinata.cloud/ipfs/" + paper.contentHash
              }
              returnable.papers.push(retPaper);
            }
            returnable.status = true;
            return returnable;
          }
          catch (err) {
            return {status: false};
          }
          
        });
      return returnable;
    },
  }));